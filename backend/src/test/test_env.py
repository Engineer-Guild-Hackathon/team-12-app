import os
import re


def test_env_variables_exist():
    required = {
        "GCP_PROJECT": r"^[a-z][a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$",
        "DB_NAME": r"^\w+$",
        "DB_USER": r"^\w+$",
        "GCS_BUCKET": r"^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$",
    }

    for key, pattern in required.items():
        value = os.getenv(key)
        assert value, f"{key} が未設定です"
        assert re.match(pattern, value), f"{key} の値が不正です: {value}"
