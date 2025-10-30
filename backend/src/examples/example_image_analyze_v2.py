from __future__ import annotations

import logging

from flask import Flask, jsonify, render_template
from src.routes.image_route import image_bp
from src.routes.img_analyze_route import img_analyze_bp
from src.utils.config import CONFIG

# Flaskに同梱するテンプレートディレクトリを、このファイルと同じ場所に設定
app = Flask(__name__, template_folder="template")

app.secret_key = "dev-analyze-secret-key"
app.logger.setLevel(logging.INFO)

# 画像アップロードAPIと画像解析APIの両方を有効化
app.register_blueprint(image_bp, url_prefix="")
app.register_blueprint(img_analyze_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    """
    テスト用のHTMLページを返すだけ。
    ページ内のスクリプトが fetch で /api/image_analyze を呼び出す。
    """
    return render_template("example_image_analyze_v2.html")


@app.get("/health")
def health():
    """プロセスが生きているか（疎通確認）"""
    return jsonify({"ok": True}), 200


@app.get("/ready")
def ready():
    """APIキーが設定されているかなど、最低限の準備完了を確認"""
    return jsonify({"ready": bool(CONFIG.GEMINI_API_KEY)}), 200


if __name__ == "__main__":
    # APIを同一プロセスで叩く必要は無いので、threaded は任意
    app.run(host="0.0.0.0", port=5001, debug=True)
