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
    /api/posts/<id>/related の返却形式が複数あり得るため、堅牢に解析する。
    """
    related_posts = []

    api_url_related = request.url_root.rstrip("/") + f"/api/posts/{search_post_id_str}/related"
    resp_related = requests.get(api_url_related, timeout=20)
    app.logger.info(f"[2] Related post API response: {resp_related.status_code}")

    # ステータスチェック
    resp_related.raise_for_status()
    data = resp_related.json()
    app.logger.info(f"[2a] Related API JSON: {data}")

    # --- 1) related_post_ids / post_ids ---
    related_ids = data.get("related_post_ids") or data.get("post_ids")
    if related_ids:
        app.logger.info(f"[3] Related post IDs (direct): {related_ids}")
    else:
        # --- 2) posts は投稿オブジェクト（すでに詳細を返している） ---
        posts_obj = data.get("posts")
        if posts_obj and isinstance(posts_obj, list) and len(posts_obj) > 0:
            # posts が既に投稿オブジェクト配列を返すケース
            app.logger.info(f"[3] Related posts returned directly (count={len(posts_obj)})")
            # 画像の署名付きURLなどが必要ならここで image API を叩いて補完するか
            # もし posts_obj に image 情報が入っていればそのまま返却可能
            # ここでは posts_obj をそのまま返す（既に full post ならこれで完了）
            app.logger.info(f"[3] Returning posts directly: {posts_obj}")
            return posts_obj

        # --- 3) Vertex/DiscoveryEngine style: results -> document ... ---
        if "results" in data and isinstance(data["results"], list):
            ids = []
            for r in data["results"]:
                # r may be dict or object; handle dict path
                try:
                    # result.document.id
                    doc = r.get("document") if isinstance(r, dict) else None
                    if doc:
                        # first try id
                        doc_id = doc.get("id") or None
                        if not doc_id:
                            # try name last segment
                            name = doc.get("name")
                            if name:
                                doc_id = name.split("/")[-1]
                        # sometimes the original post_id is nested in structData fields
                        if not doc_id and "structData" in doc:
                            sd = doc.get("structData")
                            # sd could be nested; try sd.get("id") or sd.get("fields")...
                            if isinstance(sd, dict):
                                # try direct id
                                if sd.get("id"):
                                    doc_id = sd.get("id")
                                # or nested structData -> id
                                nested = sd.get("structData")
                                if not doc_id and isinstance(nested, dict) and nested.get("id"):
                                    doc_id = nested.get("id")
                        if doc_id:
                            ids.append(doc_id)
                except Exception:
                    continue
            if ids:
                related_ids = ids
                app.logger.info(f"[3] Related post IDs (from results): {related_ids}")

    # --- ここまでで related_ids がなければ空リストとして扱う ---
    if not related_ids:
        app.logger.info("[3] No related IDs found in response.")
        return []

    # --- Step 2: 各IDの詳細情報と画像URLを取得（従来どおり） ---
    for post_id in related_ids:
        if not post_id:
            continue
        # a) 投稿の詳細情報を取得
        api_url_post = request.url_root.rstrip("/") + f"/api/posts/{post_id}"
        resp_post = requests.get(api_url_post, timeout=10)
        if not resp_post.ok:
            app.logger.warning(f"投稿詳細の取得に失敗 (ID: {post_id})")
            continue

        post_data = resp_post.json().get("post", {})
        img_id = post_data.get("img_id")

        # b) 画像の署名付きURLを取得
        if img_id:
            api_url_image = request.url_root.rstrip("/") + f"/api/images/{img_id}"
            resp_image = requests.get(api_url_image, timeout=10)
            if resp_image.ok:
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
