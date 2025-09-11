import os
from typing import Callable, Optional, Tuple

import sqlalchemy as sa
from google.cloud import secretmanager
from google.cloud.sql.connector import Connector
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _validate_env() -> None:
    """環境変数が正常に設定されているか確認"""
    required = ["GCP_PROJECT", "DB_NAME", "DB_USER", "PROJECT_ID", "SECRET_ID"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise RuntimeError(f"Missing env vars: {', '.join(missing)}")


def _access_secret_version(project_id: str, secret_id: str, version_id: str) -> str:
    """Secret Manager からパスワード取得"""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    resp = client.access_secret_version(request={"name": name})
    return resp.payload.data.decode("UTF-8")


def _make_connection_creator(
    instance_connection_name: str,
    db_name: str,
    db_user: str,
    db_password: str,
) -> Tuple[Callable[[], object], Connector]:
    """
    SQLAlchemy の creator に渡す「接続を返す関数」と Connector 本体を返す。
    """
    connector = Connector()

    def getconn():
        return connector.connect(
            instance_connection_name,
            "pg8000",
            user=db_user,
            password=db_password,
            db=db_name,
        )

    return getconn, connector


def connect_db() -> Tuple[
    Optional[Engine], Optional[sessionmaker], object, Optional[Connector]
]:
    """
    Cloud SQL への接続を初期化して返す。
    成功時: (engine, SessionLocal, Base, connector)
    失敗時: (None, None, object, None)
    """
    try:
        _validate_env()

        gcp_project = os.environ["GCP_PROJECT"]
        db_name = os.environ["DB_NAME"]
        db_user = os.environ["DB_USER"]
        project_id = os.environ["PROJECT_ID"]
        secret_id = os.environ["SECRET_ID"]
        version_id = os.getenv("VERSION_ID", "latest")

        db_password = _access_secret_version(project_id, secret_id, version_id)

        creator, connector = _make_connection_creator(
            gcp_project, db_name, db_user, db_password
        )

        engine = sa.create_engine(
            "postgresql+pg8000://",
            creator=creator,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=2,
            pool_recycle=1800,
        )

        # 開通チェック
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")

        SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
        Base = declarative_base()

        return engine, SessionLocal, Base, connector

    except Exception as e:
        print(f"ERROR: Failed to connect to Cloud SQL: {e}")
        return None, None, object, None


def disconnect_db(engine: Optional[Engine], connector: Optional[Connector]) -> None:
    """アプリ終了時などに接続資源を解放する。"""
    try:
        if engine is not None:
            engine.dispose()
    finally:
        if connector is not None:
            try:
                connector.close()
            except Exception:
                pass
