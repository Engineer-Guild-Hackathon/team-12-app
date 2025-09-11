import datetime
import os

from google.cloud import storage
from google.oauth2 import service_account

# 環境変数の取得
KEY_PATH = os.environ["SERVICE_ACCOUNT_CREDENTIALS"]
BUCKET_NAME = os.environ["GCS_BUCKET"]
BLOB_NAME = "images/db5b25a7-050c-422c-a1d7-0d51dc57a1a3.png"


def generate_download_signed_url_v4(bucket_name, blob_name):
    """Generates a v4 signed URL for downloading a blob.

    Note that this method requires a service account key file. You can not use
    this if you are using Application Default Credentials from Google Compute
    Engine or from the Google Cloud SDK.
    """

    credentials = service_account.Credentials.from_service_account_file(
        KEY_PATH,
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )

    storage_client = storage.Client(
        credentials=credentials,
        project=credentials.project_id,
    )

    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        # This URL is valid for 15 minutes
        expiration=datetime.timedelta(minutes=15),
        # Allow GET requests using this URL.
        method="GET",
    )

    print("Generated GET signed URL:")
    print(url)
    print("You can use this URL with any user agent, for example:")
    print("curl '{}'".format(url))
    return url


generate_download_signed_url_v4(BUCKET_NAME, BLOB_NAME)
