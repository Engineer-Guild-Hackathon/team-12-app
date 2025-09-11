import logging
import os
import uuid

import requests
from flask import Flask, flash, redirect, render_template, request, url_for

from src.routes.image_route import image_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-image"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（/images, /images/<img_id> などが有効化される）
app.register_blueprint(image_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    return render_template("example_image.html")


# --- テストフォームのアクションを処理するプロキシルート群 ---
@app.route("/proxy/save_image", methods=["POST"])
def proxy_save_image():
    """HTMLフォームからファイルを受け取り、POST /images APIを叩く"""
    if "image_file" not in request.files:
        flash("ファイルが選択されていません。", "error")
        return redirect(url_for("index"))

    file = request.files["image_file"]
    api_url = request.url_root + "images"
    try:
        files = {"image_file": (file.filename, file.read(), file.mimetype)}
        resp = requests.post(api_url, files=files, timeout=20)

        if resp.ok:
            data = resp.json().get("image", {})
            msg = f"アップロード成功！\nImage ID: {data.get('img_id')}\nPresigned URL: {data.get('presigned_url')}"
            flash(msg, "success")
        else:
            flash(f"アップロード失敗: {resp.status_code} {resp.text}", "error")

    except requests.exceptions.RequestException as e:
        flash(f"API呼び出しエラー: {e}", "error")

    return redirect(url_for("index"))


@app.route("/proxy/get_image", methods=["GET"])
def proxy_get_image():
    """フォームからIDを受け取り、GET /images/<uuid> APIを叩く"""
    img_id_str = request.args.get("img_id")
    if not img_id_str:
        flash("Image IDが入力されていません。", "error")
        return redirect(url_for("index"))

    try:
        uuid.UUID(img_id_str)  # UUID形式か簡易チェック
    except ValueError:
        flash(f"無効なUUID形式です: {img_id_str}", "error")
        return redirect(url_for("index"))

    api_url = request.url_root + f"images/{img_id_str}"
    try:
        resp = requests.get(api_url, timeout=10)
        if resp.ok:
            flash(f"取得成功:\n{resp.json()}", "info")
        else:
            flash(f"取得失敗: {resp.status_code} {resp.text}", "error")
    except requests.exceptions.RequestException as e:
        flash(f"API呼び出しエラー: {e}", "error")

    return redirect(url_for("index"))


@app.route("/proxy/delete_image", methods=["POST"])
def proxy_delete_image():
    """フォームからIDを受け取り、DELETE /images/<uuid> APIを叩く"""
    img_id_str = request.form.get("img_id")
    if not img_id_str:
        flash("Image IDが入力されていません。", "error")
        return redirect(url_for("index"))

    try:
        uuid.UUID(img_id_str)
    except ValueError:
        flash(f"無効なUUID形式です: {img_id_str}", "error")
        return redirect(url_for("index"))

    api_url = request.url_root + f"images/{img_id_str}"
    try:
        resp = requests.delete(api_url, timeout=10)
        if resp.ok:
            flash(f"削除成功: {resp.json()}", "success")
        else:
            flash(f"削除失敗: {resp.status_code} {resp.text}", "error")
    except requests.exceptions.RequestException as e:
        flash(f"API呼び出しエラー: {e}", "error")

    return redirect(url_for("index"))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
