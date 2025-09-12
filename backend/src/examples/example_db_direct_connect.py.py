import os

import sqlalchemy
from google.cloud import secretmanager
from google.cloud.sql.connector import Connector

# 環境変数から設定値を取得
GCP_PROJECT = os.environ.get("GCP_PROJECT")
DB_NAME = os.environ.get("DB_NAME")
DB_USER = os.environ.get("DB_USER")
PROJECT_ID = os.environ.get("PROJECT_ID")
SECRET_ID = os.environ.get("SECRET_ID")
VERSION_ID = os.environ.get("VERSION_ID")


# Secret Managerを使って、パスワードを取得する
def access_secret_version(project_id, secret_id, version_id):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    payload = response.payload.data.decode("UTF-8")
    return payload


# Secret Managerから取得したパスワードを使用してDB接続を行う
secret_password = access_secret_version(project_id=PROJECT_ID, secret_id=SECRET_ID, version_id=VERSION_ID)


def getconn():
    connector = Connector()
    conn = connector.connect(
        GCP_PROJECT,
        "pg8000",
        user=DB_USER,
        password=secret_password,
        db=DB_NAME,
    )
    return conn


# SQLAlchemy Engine を作成
engine = sqlalchemy.create_engine(
    "postgresql+pg8000://",
    creator=getconn,
)

# テストクエリを実行
with engine.connect() as connection:
    result = connection.execute(sqlalchemy.text("SELECT NOW()")).fetchone()
    print("DB connection test successful. Current time:", result[0])
