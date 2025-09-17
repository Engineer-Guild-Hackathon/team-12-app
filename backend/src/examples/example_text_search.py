import logging
import os

import requests
from flask import Flask, render_template, request

# プロジェクトのAPIエンドポイントを定義したBlueprintをインポート
from src.routes.image_route import image_bp
from src.routes.post_route import post_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-text-search-secret"
app.logger.setLevel(logging.INFO)

# --- Blueprint 登録 ---
# /api/images/* と /api/posts/* の両方のエンドポイントが有効になる
app.register_blueprint(image_bp, url_prefix="/")
app.register_blueprint(post_bp, url_prefix="/")


def fetch_full_post_details(post_id: str) -> dict:
    """指定されたIDの投稿詳細と画像URLを取得するヘルパー関数"""
    api_url_post = request.url_root + f"api/posts/{post_id}"
    resp_post = requests.get(api_url_post, timeout=10)
    resp_post.raise_for_status()

    post_data = resp_post.json().get("post", {})
    img_id = post_data.get("img_id")

    if img_id:
        api_url_image = request.url_root + f"api/images/{img_id}"
        resp_image = requests.get(api_url_image, timeout=10)
        if resp_image.ok:
            post_data["image_info"] = resp_image.json().get("image", {})

    return post_data


@app.route("/", methods=["GET"])
def index():
    """
    トップページ。
    'q'パラメータがあれば、テキスト検索APIを叩いて結果を表示する。
    """
    search_query = request.args.get("q")  # 検索クエリは 'q' パラメータで受け取る
    posts = []
    error_message = None

    if search_query:
        try:
            # --- Step 1: テキスト検索APIを呼び出し、IDリストを取得 ---
            api_url_search = request.url_root + "api/posts/search"
            params = {"q": search_query, "limit": 12}  # 12件まで取得

            app.logger.info(f"Searching posts with query: {search_query}")

            resp_search = requests.get(api_url_search, params=params, timeout=20)
            app.logger.info(f"Search API response status: {resp_search}")
            resp_search.raise_for_status()

            # search_by_textが返す投稿オブジェクトのリストを直接利用
            posts_from_search = resp_search.json().get("posts", [])
            app.logger.info(f"Found {len(posts_from_search)} posts for query '{search_query}'.")

            # --- Step 2: 各投稿の画像URLを取得 ---
            # (search_by_textが完全な投稿オブジェクトを返すため、このループは画像URLの補完が主目的)
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

@app.route("/debug/routes")
def list_routes():
    """
    現在Flaskアプリに登録されている全てのルートを一覧表示するデバッグ用エンドポイント。
    """
    import urllib
    output = []
    for rule in app.url_map.iter_rules():
        options = {}
        for arg in rule.arguments:
            options[arg] = f"[{arg}]"

        methods = ','.join(rule.methods)
        url = urllib.parse.unquote(rule.rule)
        line = f"{rule.endpoint:50s} {methods:20s} {url}"
        output.append(line)

    # 整形してプレーンテキストとして返す
    return "<pre>" + "\n".join(sorted(output)) + "</pre>"


# --- サーバー起動 ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
