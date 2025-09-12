import logging
import os
import uuid

import requests
from flask import Flask, flash, redirect, render_template, request, url_for
from src.routes.image_route import image_bp
from src.routes.post_route import post_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-post-with-image-secret"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（/images, /posts の両方が有効化される）
app.register_blueprint(image_bp, url_prefix="")
app.register_blueprint(post_bp, url_prefix="")


def _default_post_form_values():
    """フォームの初期値をPython側で生成"""
    return {
        "user_id": str(uuid.uuid4()),
        "img_id": str(uuid.uuid4()),
        # 入力フィールド
        "question": "LLMに質問したい内容のテキスト",
        "target": "写真の対象物名のテキスト",
        "answer": "LLMの回答内容のテキスト",
        "toi": "LLMからの「問い」のテキスト",
        # 緯度経度（札幌駅あたりをデフォルトに）
        "latitude": 43.0680,
        "longitude": 141.3500,
    }


@app.route("/", methods=["GET"])
def index():
    """Step 1: 画像アップロードフォームを表示する"""
    return render_template("example_post_with_image.html")


@app.route("/upload-image-for-post", methods=["POST"])
def upload_image_for_post():
    """
    Step 1.5: 画像をアップロードし、成功したらStep 2の投稿フォームを表示する
    """
    if "image_file" not in request.files:
        flash("ファイルが選択されていません。")
        return redirect(url_for("index"))

    file = request.files["image_file"]
    api_url = request.url_root + "api/images"
    try:
        # 1. Image APIを叩いて画像を保存
        files = {"image_file": (file.filename, file.read(), file.mimetype)}
        resp = requests.post(api_url, files=files, timeout=20)

        if not resp.ok:
            flash(f"画像アップロード失敗: {resp.status_code} {resp.text}")
            return redirect(url_for("index"))

        # 2. 成功したら、返ってきたimg_idを取得
        image_data = resp.json().get("image", {})
        img_id = image_data.get("img_id")
        if not img_id:
            flash("画像アップロードには成功しましたが、img_idを取得できませんでした。")
            return redirect(url_for("index"))

        # 3. 投稿フォームのデフォルト値を作成し、img_idを設定
        form_values = _default_post_form_values()
        form_values["img_id"] = img_id

        # 4. フォームの値を渡してテンプレートを再レンダリング
        return render_template("example_post_with_image.html", post_form=form_values)

    except requests.exceptions.RequestException as e:
        flash(f"Image API呼び出しエラー: {e}")
        return redirect(url_for("index"))


# --- サーバー起動 ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
