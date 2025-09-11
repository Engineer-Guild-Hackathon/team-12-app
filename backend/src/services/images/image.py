import hashlib
import io
import mimetypes
import os
import uuid

import sqlalchemy as sa
from google.cloud import storage
from google.cloud.sql.connector import Connector
from sqlalchemy.orm import declarative_base, sessionmaker

# ----------------------------------
# 1. 設定 (DB, GCS, Model)
# ----------------------------------

# --- 環境変数の読み込み ---
PROJECT  = os.environ.get("GCP_PROJECT", "")
REGION   = os.environ.get("CLOUDSQL_REGION", "")
INSTANCE = os.environ.get("CLOUDSQL_INSTANCE", "")
DB_NAME  = os.environ.get("DB_NAME", "")
DB_USER  = os.environ.get("DB_USER", "")
DB_PASS  = os.environ.get("DB_PASSWORD")
GCS_BUCKET = os.environ.get("GCS_BUCKET", "")

# --- DB接続 (Cloud SQL Python Connector) ---
try:
    connector = Connector()
    def getconn():
        return connector.connect(
            f"{PROJECT}:{REGION}:{INSTANCE}", "pg8000",
            user=DB_USER, password=DB_PASS, db=DB_NAME,
        )
    engine = sa.create_engine("postgresql+pg8000://", creator=getconn, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
    Base = declarative_base()
except Exception as e:
    # 環境変数が設定されていない場合などのエラーハンドリング
    print(f"ERROR: Failed to initialize database connection: {e}")
    engine = None
    SessionLocal = None
    Base = object # declarative_base() が失敗した場合のフォールバック

# --- DBモデル定義 ---
if Base is not object:
    class Image(Base):
        __tablename__ = "images"
        img_id      = sa.Column(sa.Uuid, primary_key=True)
        gcs_uri     = sa.Column(sa.Text, nullable=False)
        mime_type   = sa.Column(sa.Text, nullable=False)
        size_bytes  = sa.Column(sa.BigInteger, nullable=False)
        sha256_hex  = sa.Column(sa.String(64), nullable=False)
        status      = sa.Column(sa.Text, nullable=False)
        created_at  = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"))
        updated_at  = sa.Column(sa.DateTime(timezone=True), server_default=sa.text("now()"))

# --- GCSクライアント ---
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(GCS_BUCKET)
except Exception as e:
    print(f"ERROR: Failed to initialize GCS client: {e}")
    bucket = None

# ----------------------------------
# 2. ロジッククラスの定義
# ----------------------------------

class SaveImage:
    """画像の保存処理を行うクラス"""
    def __init__(self, file_storage):
        """
        Args:
            file_storage (werkzeug.datastructures.FileStorage): Flaskのrequest.filesから取得したファイルオブジェクト
        """
        self.file = file_storage

    def _guess_ext(self, mime_type: str) -> str:
        ext = mimetypes.guess_extension(mime_type) or ""
        return ".jpg" if ext in (".jpe",) else ext

    def execute(self):
        """保存処理を実行し、結果とHTTPステータスコードを返す"""
        data = self.file.read()
        if not data:
            return {"error": "empty file"}, 400

        mime_type = self.file.mimetype or "application/octet-stream"
        if not mime_type.startswith("image/"):
            return {"error": "not an image"}, 400

        size_bytes = len(data)
        sha256_hex = hashlib.sha256(data).hexdigest()
        img_id = uuid.uuid4()
        ext = self._guess_ext(mime_type)
        object_name = f"images/{img_id}{ext}"
        gcs_uri = f"gs://{GCS_BUCKET}/{object_name}"

        db = SessionLocal()
        try:
            # 1. DBにpending状態で先行して書き込む
            db_img = Image(
                img_id=img_id, gcs_uri=gcs_uri, mime_type=mime_type,
                size_bytes=size_bytes, sha256_hex=sha256_hex, status="pending",
            )
            db.add(db_img)
            db.commit()

            # 2. GCSへアップロード
            blob = bucket.blob(object_name)
            blob.upload_from_file(io.BytesIO(data), content_type=mime_type)

            # 3. DBのステータスをstoredに更新
            db.query(Image).filter_by(img_id=img_id).update({"status": "stored"})
            db.commit()

            return {
                "img_id": str(img_id), "gcs_uri": gcs_uri, "status": "stored"
            }, 201

        except Exception as e:
            db.rollback()
            # エラーが発生した場合、可能であればステータスをfailedに更新
            try:
                # img_idが確定している場合のみ更新
                if 'img_id' in locals() and db.query(Image).filter_by(img_id=img_id).first():
                    db.query(Image).filter_by(img_id=img_id).update({"status": "failed"})
                    db.commit()
            except Exception as update_err:
                db.rollback()
                print(f"Failed to update status to 'failed': {update_err}")

            return {"error": f"an error occurred: {e}", "img_id": str(img_id) if 'img_id' in locals() else None}, 500
        finally:
            db.close()
