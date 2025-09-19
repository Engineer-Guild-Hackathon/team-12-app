# metadata.jsonl ファイルを生成し、GCS にアップロードするスクリプト
# 実行すると metadata.jsonl は上書きされ、最新のデータで更新される
import json
import os
import sys
from pathlib import Path

from google.cloud import discoveryengine

# サービス層のモジュールとモデルをインポート
from src.services.image.image import GCS_BUCKET, Image, adc_bucket
from src.services.post.post import Post, SessionLocal

# プロジェクトルートをPythonパスに追加
try:
    BASE_DIR = Path(__file__).resolve().parents[3]
    sys.path.insert(0, str(BASE_DIR))
except IndexError:
    sys.exit("ERROR: Could not determine the project's base directory.")

OUTPUT_FILENAME = "metadata.jsonl"
GCS_METADATA_FOLDER = "metadata"  # GCS上のアップロード先フォルダ
# Vertex AI SearchがサポートするMIMEタイプのリスト
SUPPORTED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Vertex AI Search用の設定
GCP_PROJECT_ID = os.environ.get("PROJECT_ID")
GCP_LOCATION = os.environ.get("GCP_LOCATION", "global")
DATA_STORE_ID = os.environ.get("DATA_STORE_ID")

def trigger_import(gcs_uri: str):
    """
    指定されたGCS URIから、Vertex AI Searchデータストアへのインポートをトリガーする
    """
    print(f"Triggering import for data store '{DATA_STORE_ID}' from '{gcs_uri}'...")
    try:
        # ドキュメントを操作するためのクライアントを初期化
        client = discoveryengine.DocumentServiceClient()

        # データストアの完全なパス
        parent = client.branch_path(
            project=GCP_PROJECT_ID,
            location=GCP_LOCATION,
            data_store=DATA_STORE_ID,
            branch="default_branch",
        )

        request = discoveryengine.ImportDocumentsRequest(
            parent=parent,
            gcs_source=discoveryengine.GcsSource(input_uris=[gcs_uri]),
            # FULLモードは、既存のインデックスをすべて削除し完全に置き換える
            reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.FULL,
        )

        # インポート処理を開始
        operation = client.import_documents(request=request)
        print(f"Waiting for import operation '{operation.operation.name}' to complete...")

        # 処理が完了するまで待機（必要に応じてタイムアウトを設定）
        response = operation.result()

        print(f"Import completed successfully. Error samples: {response.error_samples}")

    except Exception as e:
        print(f"ERROR: Failed to trigger Vertex AI Search import: {e}")


def main():
    """
    Cloud SQLの全投稿を読み込み、Vertex AI Search用のメタデータファイルを生成・アップロードする
    """
    if not SessionLocal or not adc_bucket:
        print("ERROR: Database or GCS client is not initialized. Check environment variables.")
        return

    print("Starting metadata generation for Vertex AI Search...")

    # 一時的にローカルにファイルを作成
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        with SessionLocal() as session:
            # PostテーブルとImageテーブルをimg_idで結合して、必要なデータを一度に取得
            query = session.query(Post, Image).join(Image, Post.img_id == Image.img_id)

            # 正常に保存された画像のみを対象とする
            results = query.filter(Image.status == "stored").all()

            print(f"Found {len(results)} valid posts to process.")

            processed_count = 0
            for post, image in results:
                # サポートされていないMIMEタイプはスキップ
                if image.mime_type not in SUPPORTED_MIME_TYPES:
                    print(f"WARN: Skipping post {post.post_id} due to unsupported MIME type: {image.mime_type}")
                    continue

                # 構造化データを作成 (リクエスト通りのフィールドのみ)
                struct_data = {
                    "user_question": post.user_question,
                    "object_label": post.object_label,
                    "ai_answer": post.ai_answer,
                    "ai_question": post.ai_question,
                    "location": post.location,
                }

                # Vertex AI Searchが要求する最終的なJSONオブジェクト
                output_json = {
                    "id": str(post.post_id),
                    "structData": struct_data,
                    "content": {"mimeType": image.mime_type, "uri": image.gcs_uri},
                }

                # ファイルに1行ずつ書き込み
                f.write(json.dumps(output_json, ensure_ascii=False) + "\n")
                processed_count += 1

                if processed_count % 100 == 0:
                    print(f"Processed {processed_count}/{len(results)} posts...")

    if processed_count == 0:
        print("No posts were processed. Aborting upload.")
        return

    print(f"Generated {OUTPUT_FILENAME} with {processed_count} entries successfully.")

    # --- GCSへのアップロード ---
    gcs_uri = f"gs://{GCS_BUCKET}/{GCS_METADATA_FOLDER}/{OUTPUT_FILENAME}"
    try:
        blob_name = f"{GCS_METADATA_FOLDER}/{OUTPUT_FILENAME}"
        blob = adc_bucket.blob(blob_name)

        print(f"Uploading {OUTPUT_FILENAME} to gs://{GCS_BUCKET}/{blob_name}...")
        blob.upload_from_filename(OUTPUT_FILENAME)
        print("Upload complete. You can now import this data into Vertex AI Search.")

    except Exception as e:
        print(f"ERROR: Failed to upload to GCS: {e}")

    finally:
        # ローカルの一時ファイルを削除
        if os.path.exists(OUTPUT_FILENAME):
            os.remove(OUTPUT_FILENAME)
            print(f"Cleaned up local file: {OUTPUT_FILENAME}")
    # Vertex AI Searchへの再インポートをトリガー
    trigger_import(gcs_uri)


if __name__ == "__main__":
    main()
