"""特定日付のバックアップから Cloud SQL の `posts` / `images` テーブルと GCS オブジェクトを復元する。"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

import sqlalchemy as sa
from google.api_core.exceptions import GoogleAPIError
from google.cloud import storage
from google.oauth2 import service_account
from sqlalchemy.dialects.postgresql import insert

from src.utils.db.cloudsql import connect_db, disconnect_db

BASE_DIR = Path(__file__).resolve().parent
POSTS_TABLE_DIR = BASE_DIR / "posts_table"
IMAGES_TABLE_DIR = BASE_DIR / "images_table"
IMAGES_ROOT_DIR = BASE_DIR / "images"
DATE_PATTERN = re.compile(r"^\d{8}$")


# ---------------------------- ユーティリティ関数 -----------------------------

def _parse_backup_date(raw: str) -> str:
    if not DATE_PATTERN.match(raw):
        raise ValueError("Backup date must be an 8-digit string (YYYYMMDD)")
    return raw


def _load_json(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def _ensure_images_directory(images_dir: Path, archive_path: Path) -> Path:
    if images_dir.exists():
        return images_dir

    if archive_path.exists():
        images_dir.mkdir(parents=True, exist_ok=True)
        shutil.unpack_archive(str(archive_path), str(images_dir))
        return images_dir

    raise FileNotFoundError(
        f"Neither directory nor archive found for images backup: {images_dir} / {archive_path}"
    )


def _normalize_datetime(value: Any) -> Any:
    if value in (None, "", "null"):
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        iso_value = value.replace("Z", "+00:00")
        return datetime.fromisoformat(iso_value)

    raise TypeError(f"Unsupported datetime value: {value!r}")


def _prepare_record(
    record: dict[str, Any],
    int_fields: Iterable[str],
    float_fields: Iterable[str],
    datetime_fields: Iterable[str],
) -> dict[str, Any]:
    prepared: dict[str, Any] = {}
    int_set = set(int_fields)
    float_set = set(float_fields)
    datetime_set = set(datetime_fields)

    for key, value in record.items():
        if value is None:
            prepared[key] = None
            continue

        if key in int_set:
            try:
                prepared[key] = int(value)
            except (TypeError, ValueError):
                prepared[key] = value
            continue

        if key in float_set:
            try:
                prepared[key] = float(value)
            except (TypeError, ValueError):
                prepared[key] = value
            continue

        if key in datetime_set:
            try:
                prepared[key] = _normalize_datetime(value)
            except Exception:
                prepared[key] = value
            continue

        prepared[key] = value

    return prepared


def _upsert_records(
    session: sa.orm.Session,
    table: sa.Table,
    records: Iterable[dict[str, Any]],
    primary_key: str,
    int_fields: Iterable[str],
    float_fields: Iterable[str],
    datetime_fields: Iterable[str],
) -> int:
    count = 0
    index_column = table.c[primary_key]

    for record in records:
        if primary_key not in record:
            continue

        filtered_record = {
            key: record[key]
            for key in record
            if key in table.c
        }

        if not filtered_record:
            continue

        prepared = _prepare_record(filtered_record, int_fields, float_fields, datetime_fields)
        stmt = insert(table).values(prepared)

        update_values = {
            key: stmt.excluded[key]
            for key in prepared
            if key != primary_key
        }

        try:
            session.execute(
                stmt.on_conflict_do_update(
                    index_elements=[index_column],
                    set_=update_values,
                )
            )
            count += 1
        except Exception as exc:
            print(f"WARN: failed to upsert into {table.name} for {primary_key}={record.get(primary_key)}: {exc}")

    return count


def _load_storage_credentials():
    raw = (os.getenv("SERVICE_ACCOUNT_CREDENTIALS") or "").strip()
    if not raw:
        return None

    try:
        if raw.startswith("{"):
            info = json.loads(raw)
            return service_account.Credentials.from_service_account_info(info)

        candidate = Path(raw).expanduser()
        if candidate.exists():
            return service_account.Credentials.from_service_account_file(str(candidate))
        print(f"WARN: SERVICE_ACCOUNT_CREDENTIALS path not found: {raw} -> falling back to ADC")
    except Exception as exc:  # noqa: BLE001
        print(f"WARN: failed to load SERVICE_ACCOUNT_CREDENTIALS ({exc}) -> falling back to ADC")
    return None


def _create_storage_client() -> storage.Client:
    project_id = os.getenv("GCP_PROJECT")
    credentials = _load_storage_credentials()
    if credentials:
        return storage.Client(project=project_id, credentials=credentials)
    return storage.Client(project=project_id)


def _parse_gcs_uri(gcs_uri: str) -> tuple[str, str]:
    if not gcs_uri.startswith("gs://"):
        raise ValueError(f"Invalid GCS URI: {gcs_uri}")
    remainder = gcs_uri[len("gs://") :]
    bucket_name, _, object_name = remainder.partition("/")
    if not bucket_name or not object_name:
        raise ValueError(f"Invalid GCS URI: {gcs_uri}")
    return bucket_name, object_name


def _local_image_path(images_dir: Path, bucket_name: str, object_name: str, default_bucket: str | None) -> Path:
    if default_bucket and bucket_name == default_bucket and object_name.startswith("images/"):
        relative = object_name[len("images/") :]
    else:
        relative = object_name
    return images_dir / relative


def upload_images_to_gcs(images_dir: Path, images_data: Iterable[dict[str, Any]]) -> None:
    try:
        client = _create_storage_client()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed to initialise Cloud Storage client: {exc}")
        return

    default_bucket = os.getenv("GCS_BUCKET")
    cached_buckets: dict[str, storage.Bucket] = {}

    success = 0
    missing_local = 0
    upload_errors = 0

    for record in images_data:
        gcs_uri = record.get("gcs_uri")
        if not isinstance(gcs_uri, str):
            continue

        try:
            bucket_name, object_name = _parse_gcs_uri(gcs_uri)
        except ValueError as exc:
            print(f"WARN: skipping invalid gcs_uri ({exc})")
            continue

        local_path = _local_image_path(images_dir, bucket_name, object_name, default_bucket)
        if not local_path.exists():
            print(f"WARN: local file missing for {gcs_uri}: {local_path}")
            missing_local += 1
            continue

        bucket = cached_buckets.get(bucket_name)
        if bucket is None:
            bucket = client.bucket(bucket_name)
            cached_buckets[bucket_name] = bucket

        blob = bucket.blob(object_name)
        try:
            blob.upload_from_filename(local_path, content_type=record.get("mime_type"))
            success += 1
        except GoogleAPIError as exc:
            print(f"ERROR: failed to upload {gcs_uri}: {exc}")
            upload_errors += 1
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR: unexpected error uploading {gcs_uri}: {exc}")
            upload_errors += 1

    print(
        "GCS upload summary:",
        f"uploaded={success}",
        f"missing_local={missing_local}",
        f"errors={upload_errors}",
    )


# ------------------------------ CLI ワークフロー ------------------------------


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup_date", help="Backup date in YYYYMMDD format.")
    parser.add_argument(
        "--skip-gcs",
        action="store_true",
        help="Do not upload image files to Cloud Storage.",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Do not restore Cloud SQL tables.",
    )
    return parser.parse_args()


def restore_to_cloudsql(posts_data: list[dict[str, Any]], images_data: list[dict[str, Any]]) -> tuple[int, int]:
    engine, SessionLocal, _, connector = connect_db()
    if engine is None or SessionLocal is None:
        raise RuntimeError("Database connection is not available; check Cloud SQL credentials.")

    metadata = sa.MetaData()
    images_table = sa.Table("images", metadata, autoload_with=engine)
    posts_table = sa.Table("posts", metadata, autoload_with=engine)

    images_int_fields = {"size_bytes"}
    images_float_fields: set[str] = set()
    images_datetime = {"created_at", "updated_at"}

    posts_int_fields = {"post_rarity"}
    posts_float_fields = {"latitude", "longitude"}
    posts_datetime = {"date", "updated_at"}

    image_count = 0
    post_count = 0

    try:
        with SessionLocal() as session:
            image_count = _upsert_records(
                session,
                images_table,
                images_data,
                primary_key="img_id",
                int_fields=images_int_fields,
                float_fields=images_float_fields,
                datetime_fields=images_datetime,
            )
            session.commit()

            post_count = _upsert_records(
                session,
                posts_table,
                posts_data,
                primary_key="post_id",
                int_fields=posts_int_fields,
                float_fields=posts_float_fields,
                datetime_fields=posts_datetime,
            )
            session.commit()
    finally:
        disconnect_db(engine, connector)

    return image_count, post_count


def main() -> int:
    args = parse_args()

    try:
        backup_date = _parse_backup_date(args.backup_date)
    except ValueError as exc:
        print(f"ERROR: {exc}")
        return 1

    posts_json_path = POSTS_TABLE_DIR / f"{backup_date}_posts_backup_data.json"
    images_json_path = IMAGES_TABLE_DIR / f"{backup_date}_images_backup_data.json"
    images_dir = IMAGES_ROOT_DIR / f"{backup_date}_images"
    images_archive = IMAGES_ROOT_DIR / f"{backup_date}_images.zip"

    if not posts_json_path.exists():
        print(f"ERROR: posts backup JSON not found: {posts_json_path}")
        return 1
    if not images_json_path.exists():
        print(f"ERROR: images backup JSON not found: {images_json_path}")
        return 1

    try:
        images_dir = _ensure_images_directory(images_dir, images_archive)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}")
        return 1

    try:
        posts_data = _load_json(posts_json_path)
        images_data = _load_json(images_json_path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed to load backup JSON files: {exc}")
        return 1

    if not args.skip_gcs:
        upload_images_to_gcs(images_dir, images_data)

    if not args.skip_db:
        try:
            images_inserted, posts_inserted = restore_to_cloudsql(posts_data, images_data)
        except Exception as exc:  # noqa: BLE001
            print(f"ERROR: failed to restore Cloud SQL tables: {exc}")
            return 1
        print(
            "Cloud SQL restore summary:",
            f"images_upserted={images_inserted}",
            f"posts_upserted={posts_inserted}",
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
