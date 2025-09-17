import datetime
import hashlib
import json
import mimetypes
import os
import uuid
from pathlib import Path
from typing import Any, Dict, Optional

import google.auth
import sqlalchemy as sa
from google.auth import iam
from google.auth.transport.requests import Request
from google.cloud import storage
from google.oauth2 import service_account
from sqlalchemy.orm import declarative_base
from src.utils.db.cloudsql import connect_db, disconnect_db

# --- DB接続初期化 ---
engine, SessionLocal, Base, connector = connect_db()

# --- GCSクライアントを初期化 ---
GCS_BUCKET = os.environ.get("GCS_BUCKET")
GCP_PROJECT = os.environ.get("GCP_PROJECT")
SERVICE_ACCOUNT_CREDENTIALS = (
    os.environ.get("SERVICE_ACCOUNT_CREDENTIALS") or ""
).strip()

# クライアント1: 一般操作用 (Application Default Credentialsを使用)
try:
    if not GCS_BUCKET:
        raise ValueError("GCS_BUCKET environment variable is not set.")
    if not GCP_PROJECT:
        raise ValueError("GCP_PROJECT environment variable is not set.")
    adc_storage_client = storage.Client(project=GCP_PROJECT)
    adc_bucket = adc_storage_client.bucket(GCS_BUCKET)
except Exception as e:
    print(f"ERROR: Failed to initialize ADC GCS client: {e}")
    adc_storage_client = None
    adc_bucket = None

# クライアント2: 署名付きURL生成専用 (サービスアカウントを使用)
# try:
#     if not SERVICE_ACCOUNT_CREDENTIALS:
#         # raise ValueError("SERVICE_ACCOUNT_CREDENTIALS environment variable is not set.")
#         print("SERVICE_ACCOUNT_CREDENTIALS environment variable is not set.")
#         sa_storage_client = None
#         sa_bucket = None
#     else:
#         sa_credentials = service_account.Credentials.from_service_account_file(
#             SERVICE_ACCOUNT_CREDENTIALS,
#         )
#         sa_storage_client = storage.Client(
#             credentials=sa_credentials, project=sa_credentials.project_id
#         )
#         sa_bucket = sa_storage_client.bucket(GCS_BUCKET)
# except Exception as e:
#     print(f"ERROR: Failed to initialize SA GCS client for signing: {e}")
#     sa_storage_client = None
#     sa_bucket = None


def _load_signer_credentials():
    """
    署名URL用の Credentials を返す。
    - 開発: SERVICE_ACCOUNT_CREDENTIALS が JSON本文 or ファイルパスならそれを使用
    - 本番: 未設定なら ADC を取得し、IAM SignBlob サイナーで「署名可能」にラップ
    """
    raw = SERVICE_ACCOUNT_CREDENTIALS
    if raw:
        try:
            # JSON 文字列が直接入っている場合
            if raw.startswith("{"):
                info = json.loads(raw)
                return service_account.Credentials.from_service_account_info(info)
            # ファイルパスが入っている場合
            p = Path(raw)
            if p.exists():
                return service_account.Credentials.from_service_account_file(str(p))
            else:
                print(
                    f"WARN: SERVICE_ACCOUNT_CREDENTIALS path not found: {raw} -> fallback to ADC"
                )
        except Exception as e:
            print(
                f"WARN: failed to use SERVICE_ACCOUNT_CREDENTIALS: {e} -> fallback to ADC"
            )

    # 本番: ADC + IAM サイナー（SignBlob）で署名可能にする
    base_creds, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    req = Request()
    if not getattr(base_creds, "valid", True) or getattr(base_creds, "expired", False):
        base_creds.refresh(req)

    # 実行中のサービスアカウントのメールを特定
    sa_email = getattr(base_creds, "service_account_email", None)
    if not sa_email:
        try:
            from google.auth.compute_engine import _metadata

            sa_email = _metadata.get_service_account_email()
        except Exception:
            pass
    if not sa_email:
        raise RuntimeError("Could not determine service account email for signing")

    signer = iam.Signer(req, base_creds, sa_email)
    return service_account.Credentials(
        signer=signer,
        service_account_email=sa_email,
        token_uri="https://oauth2.googleapis.com/token",
    )


# 署名用クレデンシャルを1本用意（開発=鍵 / 本番=ADC+IAM サイナー）
signer_credentials = _load_signer_credentials()


# モデル定義だけは可能にしておく（DB接続失敗時のクラッシュ防止）
if Base is object:
    Base = declarative_base()


class Image(Base):
    __tablename__ = "images"
    img_id = sa.Column(sa.Uuid, primary_key=True)
    gcs_uri = sa.Column(sa.Text, nullable=False)
    mime_type = sa.Column(sa.Text, nullable=False)
    size_bytes = sa.Column(sa.BigInteger, nullable=False)
    sha256_hex = sa.Column(sa.String(64), nullable=False)
    status = sa.Column(sa.Text, nullable=False)  # 'pending', 'stored', 'failed'
    created_at = sa.Column(
        sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False
    )
    updated_at = sa.Column(
        sa.TIMESTAMP(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
        nullable=False,
    )


class ImageService:
    """Image を GCS と Cloud SQL に保存・取得・削除するサービスクラス"""

    @staticmethod
    def _guess_ext(mime_type: str) -> str:
        """MIMEタイプから拡張子を推測するヘルパー関数"""
        ext = mimetypes.guess_extension(mime_type) or ""
        return ".jpg" if ext == ".jpe" else ext

    @staticmethod
    def save_image(
        file_data: bytes,
        mime_type: str,
    ) -> Optional[Dict[str, Any]]:
        """新しい Image をGCSとDBに保存し、作成結果を返す。"""
        if SessionLocal is None or adc_bucket is None:
            raise RuntimeError("Database or GCS is not initialized")

        img_id = uuid.uuid4()
        size_bytes = len(file_data)
        sha256_hex = hashlib.sha256(file_data).hexdigest()
        ext = ImageService._guess_ext(mime_type)
        object_name = f"images/{img_id}{ext}"
        gcs_uri = f"gs://{GCS_BUCKET}/{object_name}"

        with SessionLocal() as session:
            try:
                # 1. DBに 'pending' でレコードを先行して作成
                image = Image(
                    img_id=img_id,
                    gcs_uri=gcs_uri,
                    mime_type=mime_type,
                    size_bytes=size_bytes,
                    sha256_hex=sha256_hex,
                    status="pending",
                )
                session.add(image)
                session.commit()

                # 2. GCSへファイルをアップロード
                blob = adc_bucket.blob(object_name)
                blob.upload_from_string(file_data, content_type=mime_type)

                # 3. DBのステータスを 'stored' に更新
                image.status = "stored"
                session.commit()
                session.refresh(image)

                return {
                    "img_id": str(image.img_id),
                    "gcs_uri": image.gcs_uri,
                    "status": image.status,
                    "created_at": image.created_at.isoformat(),
                }

            except Exception as e:
                session.rollback()
                print(f"ERROR: failed to upload image (id: {img_id}): {e}")
                # 失敗したことをDBに記録するため、ステータスを 'failed' に更新
                try:
                    with SessionLocal() as failed_session:
                        failed_image = failed_session.get(Image, img_id)
                        if failed_image:
                            failed_image.status = "failed"
                            failed_session.commit()
                except Exception as update_err:
                    print(
                        f"ERROR: failed to update image status to 'failed': {update_err}"
                    )

                return None

    @staticmethod
    def get_image(img_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """img_id で Image を1件取得し、GCSの署名付きURLも生成して返す"""
        if SessionLocal is None or adc_storage_client is None or adc_bucket is None:
            raise RuntimeError("Database or GCS is not initialized")

        with SessionLocal() as session:
            image = session.get(Image, img_id)
            if not image or image.status != "stored":
                return None

            # GCSオブジェクト名を取得
            object_name = image.gcs_uri.replace(f"gs://{GCS_BUCKET}/", "")
            blob = adc_bucket.blob(object_name)

            # 15分間有効なダウンロード用URLを生成（開発=鍵 / 本番=ADC+IAM サイナー）
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.timedelta(minutes=15),
                method="GET",
                credentials=signer_credentials,
            )

            return {
                "img_id": str(image.img_id),
                "gcs_uri": image.gcs_uri,
                "mime_type": image.mime_type,
                "size_bytes": image.size_bytes,
                "status": image.status,
                "signed_url": signed_url,  # 署名付きURLを追加
                "created_at": image.created_at.isoformat(),
            }

    @staticmethod
    def delete_image(img_id: uuid.UUID) -> bool:
        """
        GCS上のファイルとDBのレコードの両方を削除する。
        成功したら True, 存在しなければ False を返す。
        """
        if SessionLocal is None or adc_bucket is None:
            raise RuntimeError("Database or GCS is not initialized")

        with SessionLocal() as session:
            image = session.get(Image, img_id)
            if not image:
                return False

            try:
                # 1. GCSからファイルを削除
                try:
                    object_name = image.gcs_uri.replace(f"gs://{GCS_BUCKET}/", "")
                    blob = adc_bucket.blob(object_name)
                    blob.delete()
                except Exception as gcs_err:
                    print(
                        f"WARN: Failed to delete GCS object {image.gcs_uri}: {gcs_err}"
                    )

                # 2. DBからレコードを削除
                session.delete(image)
                session.commit()
                return True

            except Exception as e:
                session.rollback()
                print(f"ERROR: failed to delete image (id: {img_id}): {e}")
                return False


# --- アプリ終了時のクリーンアップ ---
def close_db_and_gcs():
    """DBとGCSのコネクションを閉じる"""
    if engine and connector:
        disconnect_db(engine, connector)
