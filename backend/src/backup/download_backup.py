"""Cloud SQL の `posts` / `images` テーブルをエクスポートし、参照される GCS オブジェクトを取得するユーティリティスクリプト。"""

from __future__ import annotations

import base64
import json
import os
import shutil
import sys
import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable

import sqlalchemy as sa
from google.api_core.exceptions import GoogleAPIError, NotFound
from google.cloud import storage
from google.oauth2 import service_account

from src.utils.db.cloudsql import connect_db, disconnect_db

BACKUP_DATE = datetime.now().strftime("%Y%m%d")
BASE_DIR = Path(__file__).resolve().parent
POSTS_JSON_PATH = BASE_DIR / "posts_table" / f"{BACKUP_DATE}_posts_backup_data.json"
IMAGES_JSON_PATH = BASE_DIR / "images_table" / f"{BACKUP_DATE}_images_backup_data.json"
IMAGES_ROOT_DIR = BASE_DIR / "images"
IMAGES_DOWNLOAD_DIR = IMAGES_ROOT_DIR / f"{BACKUP_DATE}_images"
IMAGES_ARCHIVE_PATH = IMAGES_ROOT_DIR / f"{BACKUP_DATE}_images.zip"


def _normalize_value(value: Any) -> Any:
    """SQLAlchemy / psycopg が返す値を JSON で扱える基本型へ変換する。"""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, bytes):
        return base64.b64encode(value).decode("ascii")
    if isinstance(value, memoryview):
        return base64.b64encode(value.tobytes()).decode("ascii")
    return value


def _fetch_table_data(session: Any, table_name: str) -> list[dict[str, Any]]:
    stmt = sa.text(f"SELECT * FROM {table_name}")
    rows = session.execute(stmt).mappings().all()
    return [{key: _normalize_value(val) for key, val in row.items()} for row in rows]


def _save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)


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
        print(
            f"WARN: SERVICE_ACCOUNT_CREDENTIALS path not found: {raw} -> falling back to ADC"
        )
    except Exception as exc:  # noqa: BLE001 - フォールバック用の警告として扱う
        print(
            f"WARN: failed to load SERVICE_ACCOUNT_CREDENTIALS ({exc}) -> falling back to ADC"
        )
    return None


def _create_storage_client() -> storage.Client:
    project_id = os.getenv("GCP_PROJECT")
    credentials = _load_storage_credentials()
    if credentials:
        return storage.Client(project=project_id, credentials=credentials)
    return storage.Client(project=project_id)


def download_images_from_gcs(
    images_data: Iterable[dict[str, Any]],
    download_dir: Path,
    allowed_img_ids: set[str] | None = None,
) -> None:
    bucket_name = os.getenv("GCS_BUCKET")
    if not bucket_name:
        print("WARN: GCS_BUCKET is not configured; skipping image download")
        return

    try:
        client = _create_storage_client()
        bucket = client.bucket(bucket_name)
    except Exception as exc:  # noqa: BLE001 - エラーを記録して処理を継続する
        print(f"ERROR: failed to initialise Cloud Storage client: {exc}")
        return

    if download_dir.exists():
        shutil.rmtree(download_dir)
    download_dir.mkdir(parents=True, exist_ok=True)
    prefix = f"gs://{bucket_name}/"

    success = 0
    missing = 0
    skipped = 0
    errors = 0
    filtered_out = 0

    for record in images_data:
        record_img_id = record.get("img_id")
        if allowed_img_ids is not None:
            img_id_str = str(record_img_id) if record_img_id is not None else None
            if img_id_str not in allowed_img_ids:
                filtered_out += 1
                continue

        gcs_uri = record.get("gcs_uri")
        if not gcs_uri or not isinstance(gcs_uri, str):
            skipped += 1
            continue

        if gcs_uri.startswith(prefix):
            object_name = gcs_uri[len(prefix) :]
        else:
            # オブジェクトが別バケットの場合は URI 全体を使って階層を保持する
            object_name = gcs_uri.replace("gs://", "")

        if object_name.startswith("images/"):
            relative_name = object_name[len("images/") :]
        else:
            relative_name = object_name

        destination = download_dir / relative_name
        destination.parent.mkdir(parents=True, exist_ok=True)

        try:
            blob = bucket.blob(object_name)
            blob.download_to_filename(destination)
            success += 1
        except NotFound:
            print(f"WARN: object not found in bucket {bucket_name}: {object_name}")
            missing += 1
        except GoogleAPIError as exc:
            print(f"ERROR: failed to download {object_name}: {exc}")
            errors += 1
        except Exception as exc:  # noqa: BLE001 - 例外を握りつぶして続行する
            print(f"ERROR: unexpected error downloading {object_name}: {exc}")
            errors += 1

    print(
        "Image download summary:",
        f"success={success}",
        f"missing={missing}",
        f"skipped={skipped}",
        f"errors={errors}",
        f"filtered_out={filtered_out}",
        f"directory={download_dir}",
    )


def export_tables() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    engine, SessionLocal, _, connector = connect_db()
    if engine is None or SessionLocal is None:
        raise RuntimeError(
            "Database connection is not available; check Cloud SQL credentials."
        )

    try:
        with SessionLocal() as session:
            posts_data = _fetch_table_data(session, "posts")
            images_data = _fetch_table_data(session, "images")
    finally:
        disconnect_db(engine, connector)

    return posts_data, images_data


def compress_downloaded_images(download_dir: Path, archive_path: Path) -> Path | None:
    if not download_dir.exists():
        print(f"WARN: download directory does not exist: {download_dir}")
        return None

    if archive_path.exists():
        archive_path.unlink()

    archive_file = shutil.make_archive(str(download_dir), "zip", root_dir=download_dir)
    created_path = Path(archive_file)
    if created_path != archive_path:
        # shutil.make_archive が返すパスと期待する名称を揃えておく
        created_path.rename(archive_path)
        created_path = archive_path

    print(f"Created archive: {created_path}")
    return created_path


def main() -> int:
    try:
        posts_data, images_data = export_tables()
        _save_json(POSTS_JSON_PATH, posts_data)
        _save_json(IMAGES_JSON_PATH, images_data)
        post_img_ids = {
            str(post.get("img_id"))
            for post in posts_data
            if post.get("img_id") is not None
        }
        download_images_from_gcs(images_data, IMAGES_DOWNLOAD_DIR, post_img_ids)
        compress_downloaded_images(IMAGES_DOWNLOAD_DIR, IMAGES_ARCHIVE_PATH)
    except Exception as exc:  # noqa: BLE001 - CLI 実行時の最終的な安全弁
        print(f"ERROR: backup process failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
