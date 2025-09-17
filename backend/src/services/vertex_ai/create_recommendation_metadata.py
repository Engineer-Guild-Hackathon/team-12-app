import json
import os
import sys
from pathlib import Path

# プロジェクトルートをPythonパスに追加
try:
    # このスクリプト(src/scripts/...)から見て、プロジェクトルート(backend/)は2階層上
    BASE_DIR = Path(__file__).resolve().parents[2]
    sys.path.insert(0, str(BASE_DIR))
except IndexError:
    sys.exit("ERROR: Could not determine the project's base directory.")

# サービス層のモジュールとモデルをインポート
# これにより、DB/GCSの接続情報も初期化される
from src.services.image.image import GCS_BUCKET, adc_bucket
from src.services.post.post import Post, SessionLocal

# --- 設定 ---
# 以前のファイルと競合しないように、名前と場所を変更
OUTPUT_FILENAME = "recommendation_metadata.jsonl"
GCS_UPLOAD_FOLDER = "recommendation-metadata"  # GCS上のアップロード先フォルダ
FRONTEND_APP_BASE_URL = "https://front-app-708894055394.asia-northeast1.run.app"


def main():
    """
    Cloud SQLの全投稿を読み込み、Vertex AI Recommendations用のメタデータファイルを生成・アップロードする
    """
    if not SessionLocal or not adc_bucket:
        print("ERROR: Database or GCS client is not initialized. Check environment variables.")
        return

    print("Starting metadata generation for Vertex AI Recommendations...")

    # 一時的にローカルにファイルを作成
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        with SessionLocal() as session:
            # 必要なのはPostテーブルのデータのみ
            all_posts = session.query(Post).all()
            print(f"Found {len(all_posts)} posts to process.")

            for i, post in enumerate(all_posts):
                # descriptionフィールド用に、関連するテキストを結合
                description = (
                    f"ユーザーの質問: {post.user_question}\n"
                    f"AIの回答: {post.ai_answer}\n"
                    f"AIからの問いかけ: {post.ai_question}"
                )

                # Recommendations AIが要求する最終的なJSONオブジェクト
                output_json = {
                    "id": str(post.post_id),
                    "url": f"{FRONTEND_APP_BASE_URL}/discoveries/{str(post.post_id)}",
                    "title": post.object_label,
                    "description": description,
                    "custom_fields": {
                        "location": post.location,
                        # 必要に応じて他のメタデータを追加可能
                        # "latitude": post.latitude,
                        # "longitude": post.longitude,
                    },
                }

                # ファイルに1行ずつ書き込み
                f.write(json.dumps(output_json, ensure_ascii=False) + "\n")

                if (i + 1) % 100 == 0:
                    print(f"Processed {i + 1}/{len(all_posts)} posts...")

    print(f"Generated {OUTPUT_FILENAME} with {len(all_posts)} entries successfully.")

    # --- GCSへのアップロード ---
    try:
        blob_name = f"{GCS_UPLOAD_FOLDER}/{OUTPUT_FILENAME}"
        blob = adc_bucket.blob(blob_name)

        print(f"Uploading {OUTPUT_FILENAME} to gs://{GCS_BUCKET}/{blob_name}...")
        blob.upload_from_filename(OUTPUT_FILENAME)
        print("Upload complete. You can now import this data into Vertex AI Recommendations.")

    except Exception as e:
        print(f"ERROR: Failed to upload to GCS: {e}")

    finally:
        # ローカルの一時ファイルを削除
        if os.path.exists(OUTPUT_FILENAME):
            os.remove(OUTPUT_FILENAME)
            print(f"Cleaned up local file: {OUTPUT_FILENAME}")


if __name__ == "__main__":
    main()
