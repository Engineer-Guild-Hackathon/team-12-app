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

# Blueprint 登録
app.register_blueprint(image_bp, url_prefix="")
app.register_blueprint(post_bp, url_prefix="")


def attach_image_info(post: dict, request, app: Flask) -> dict:
    """
    post に signed_url を追加する。
    """
    # キー正規化: post_id
    if "post_id" not in post and "id" in post:
        post["post_id"] = post.get("id")

    # 画像IDを探す
    img_id = post.get("img_id")
    if not img_id:
        return post

    post["img_id"] = img_id  # 保証しておく

    # すでに image_info があり signed_url を持っているならそのまま
    image_info = post.get("image_info")
    if isinstance(image_info, dict):
        if image_info.get("signed_url"):
            # 正規化
            signed = image_info.get("signed_url")
            image_info["signed_url"] = signed
            post["image_info"] = image_info
            return post

    # API 呼び出し
    try:
        base = request.url_root.rstrip("/")
        api_url_image = f"{base}/api/images/{img_id}"
        resp = requests.get(api_url_image, timeout=10)
        if not resp.ok:
            app.logger.warning(
                f"attach_image_info: /api/images returned non-OK status {resp.status_code} for img_id={img_id}"
            )
            return post

        payload = resp.json()
        # 多くの実装は { "image": { ... } }
        image_obj = {}
        if isinstance(payload, dict) and "image" in payload and isinstance(payload["image"], dict):
            image_obj = payload["image"]
        elif isinstance(payload, dict):
            # もしかして直下に signed_url がある場合
            image_obj = payload

        # 正規化 signed_url
        signed = image_obj.get("signed_url") or image_obj.get("signedUrl") or image_obj.get("url")
        if signed:
            image_obj["signed_url"] = signed

        post["image_info"] = image_obj
        return post

    except requests.RequestException as e:
        app.logger.warning(f"attach_image_info: failed to fetch image info for img_id={img_id}: {e}")
        return post


# -----------------------------
# メイン: 関連投稿を取得して image_info を付与する
# -----------------------------
def fetch_related_posts(search_post_id_str: str, request, app: Flask):
    """
    - /api/posts/{id}/related のレスポンスが { "posts": [...] } を返す場合を想定
    - 互換のため related_post_ids が返るケースにも対応
    - 各 post に対して attach_image_info を呼んで署名付き URL を付与する
    """
    base = request.url_root.rstrip("/")
    api_url_related = f"{base}/api/posts/{search_post_id_str}/related"
    try:
        resp = requests.get(api_url_related, timeout=20)
        resp.raise_for_status()
    except requests.RequestException:
        app.logger.exception(f"fetch_related_posts: related API call failed for post_id={search_post_id_str}")
        raise

    data = resp.json() if isinstance(resp.json(), (dict, list)) else {}
    app.logger.info(
        f"fetch_related_posts: related API keys = {list(data.keys()) if isinstance(data, dict) else 'list/other'}"
    )

    # 1) posts が直接返却されている場合
    posts = data.get("posts") if isinstance(data, dict) else None

    # 2) posts を正規化して image_info を付与
    result = []
    for p in posts or []:
        if not isinstance(p, dict):
            try:
                p = dict(p)
            except Exception:
                continue
        try:
            p_with_image = attach_image_info(p, request, app)
        except Exception:
            # attach_image_info は通常例外を投げないはずだが保険
            app.logger.exception("fetch_related_posts: attach_image_info failed")
            p_with_image = p
        result.append(p_with_image)

    return result


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
