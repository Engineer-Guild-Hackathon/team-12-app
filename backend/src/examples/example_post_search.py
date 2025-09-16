import logging
import os
import uuid

import requests
from flask import Flask, render_template, request

# プロジェクトのAPIエンドポイントを定義したBlueprintをインポート
from src.routes.image_route import image_bp
from src.routes.post_route import post_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-search-secret"
app.logger.setLevel(logging.INFO)

# --- Blueprint 登録 ---
# /api/images/* と /api/posts/* の両方のエンドポイントが有効になる
app.register_blueprint(image_bp, url_prefix="")
app.register_blueprint(post_bp, url_prefix="")


def fetch_related_posts(search_post_id_str, request, app):
    """
    指定された投稿IDに関連する投稿の詳細情報と画像情報を取得する。
    """
    related_posts = []
    # --- Step 1: 関連投稿のIDリストを取得 ---
    api_url_related = request.url_root + f"api/posts/{search_post_id_str}/related"
    resp_related = requests.get(api_url_related, timeout=20)

    if not resp_related.ok:
        raise Exception(f"関連投稿APIエラー: {resp_related.status_code} {resp_related.text}")

    related_ids = resp_related.json().get("related_post_ids", [])

    # --- Step 2: 各IDの詳細情報と画像URLを取得 ---
    for post_id in related_ids:
        # a) 投稿の詳細情報を取得
        api_url_post = request.url_root + f"api/posts/{post_id}"
        resp_post = requests.get(api_url_post, timeout=10)
        if not resp_post.ok:
            app.logger.warning(f"投稿詳細の取得に失敗 (ID: {post_id})")
            continue

        post_data = resp_post.json().get("post", {})
        img_id = post_data.get("img_id")

        # b) 画像の署名付きURLを取得
        if img_id:
            api_url_image = request.url_root + f"api/images/{img_id}"
            resp_image = requests.get(api_url_image, timeout=10)
            if resp_image.ok:
                # 投稿データに画像情報をマージする
                post_data["image_info"] = resp_image.json().get("image", {})

        related_posts.append(post_data)
    return related_posts


@app.route("/", methods=["GET"])
def index():
    """
    トップページ。
    'search_post_id'があれば、関連投稿APIを叩いて結果を表示する。
    """
    search_post_id_str = request.args.get("search_post_id")
    related_posts = []
    error_message = None

    if search_post_id_str:
        try:
            # 入力されたIDが有効なUUIDか検証
            uuid.UUID(search_post_id_str)
            related_posts = fetch_related_posts(search_post_id_str, request, app)
        except ValueError:
            error_message = f"無効なUUID形式です: {search_post_id_str}"
        except requests.exceptions.RequestException as e:
            error_message = f"API呼び出し中にエラーが発生しました: {e}"
        except Exception as e:
            error_message = str(e)

    return render_template(
        "example_post_search.html",
        related_posts=related_posts,
        search_post_id=search_post_id_str,
        error=error_message,
    )


# --- サーバー起動 ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    # APIを同一プロセスで叩くため threaded=True を推奨
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
