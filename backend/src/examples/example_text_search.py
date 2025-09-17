import logging
import os

import requests
from flask import Flask, render_template, request
from src.routes.image_route import image_bp
from src.routes.post_route import post_bp
from src.routes.search_route import search_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-text-search-secret"
app.logger.setLevel(logging.INFO)

# Blueprint 登録
app.register_blueprint(image_bp, url_prefix="/")
app.register_blueprint(post_bp, url_prefix="/")
app.register_blueprint(search_bp, url_prefix="/")


@app.route("/", methods=["GET"])
def index():
    """
    'q'パラメータがあれば、テキスト検索APIを叩いて結果を表示する。
    """
    search_query = request.args.get("q")  # 検索クエリは 'q' パラメータで受け取る
    posts = []
    error_message = None

    if search_query:
        try:
            # --- Step 1: テキスト検索APIを呼び出し、post_idリストを取得 ---
            api_url_search = request.url_root + "api/search"
            params = {"q": search_query, "limit": 10}  # 10件まで取得
            resp_search = requests.get(api_url_search, params=params, timeout=20)
            resp_search.raise_for_status()

            # search_by_textが返す投稿オブジェクトのリストを直接利用
            posts_from_search = resp_search.json().get("posts", [])

            # --- Step 2: 各投稿の画像URLを取得 ---
            for post_data in posts_from_search:
                img_id = post_data.get("img_id")
                if img_id:
                    api_url_image = request.url_root + f"api/images/{img_id}"
                    resp_image = requests.get(api_url_image, timeout=10)
                    if resp_image.ok:
                        post_data["image_info"] = resp_image.json().get("image", {})
                posts.append(post_data)

        except requests.exceptions.RequestException as e:
            error_message = f"API呼び出し中にエラーが発生しました: {e}"
        except Exception as e:
            app.logger.error(f"An unexpected error occurred: {e}", exc_info=True)
            error_message = str(e)

    return render_template(
        "example_text_search.html",
        posts=posts,
        search_query=search_query,
        error=error_message,
    )


# --- サーバー起動 ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
