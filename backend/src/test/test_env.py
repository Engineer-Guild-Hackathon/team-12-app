import os

def test_env_variables_exist():
    keys = [
        "GCP_PROJECT",
        "CLOUDSQL_REGION",
        "CLOUDSQL_INSTANCE",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "GCS_BUCKET",
    ]

    for key in keys:
        value = os.environ.get(key)
        assert value is not None, f"{key} が設定されていません"

def test_db_password_hidden():
    password = os.environ.get("DB_PASSWORD")
    # 文字列としては存在しているが直接ログには出さない
    assert password is not None
    assert len(password) >= 8  # 最低限の強度チェック