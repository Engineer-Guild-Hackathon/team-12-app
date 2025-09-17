# create_vertex_metadata_with_embeddings.py
import json
import sys
from pathlib import Path

from google import genai  # or your chosen embedding client
from google.cloud import storage

# プロジェクトルートをPythonパスに追加
try:
    BASE_DIR = Path(__file__).resolve().parents[3]
    sys.path.insert(0, str(BASE_DIR))
except IndexError:
    sys.exit("ERROR: Could not determine the project's base directory.")

# サービス層のモジュールとモデルをインポート
from src.services.image.image import GCS_BUCKET, Image
from src.services.post.post import Post, SessionLocal

OUTPUT_FILENAME = "metadata_with_embedding.jsonl"
GCS_METADATA_FOLDER = "metadata"

# init embedding client
genai_client = genai.Client()  # 認証済みの前提


def make_embedding(text: str):
    # 例: gemini-embedding-001 を使う
    resp = genai_client.models.embed_content(model="gemini-embedding-001", contents=[text])
    # ライブラリの戻り値の構造に合わせて取り出す
    vec = resp.embeddings[0].values
    return vec


def main():
    # DB セッションで投稿と画像を join
    processed = 0
    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as fw:
        with SessionLocal() as session:
            query = session.query(Post, Image).join(Image, Post.img_id == Image.img_id)
            results = query.filter(Image.status == "stored").all()

            for post, image in results:
                # 代表テキストを作る（あなたの方針で変更可）
                pieces = [
                    post.user_question or "",
                    post.object_label or "",
                    post.ai_answer or "",
                    post.ai_question or "",
                ]
                text_for_embedding = "\n".join([p for p in pieces if p])
                # 1) 埋め込みを作る
                embedding_vec = make_embedding(text_for_embedding)  # list[float]
                # 2) JSONL 用オブジェクト
                doc = {
                    "id": str(post.post_id),
                    "structData": {
                        "user_question": post.user_question,
                        "object_label": post.object_label,
                        "ai_answer": post.ai_answer,
                        "ai_question": post.ai_question,
                        "location": post.location,
                        "img_id": image.img_id,
                        "image": {"uri": image.gcs_uri, "mimeType": image.mime_type},
                        "embedding_vector": embedding_vec,  # ここが重要
                    },
                }
                fw.write(json.dumps(doc, ensure_ascii=False) + "\n")
                processed += 1

    # upload to GCS
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    blob_name = f"{GCS_METADATA_FOLDER}/{OUTPUT_FILENAME}"
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(OUTPUT_FILENAME)
    print(f"Uploaded {OUTPUT_FILENAME} to gs://{GCS_BUCKET}/{blob_name}")
