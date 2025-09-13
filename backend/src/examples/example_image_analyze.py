from __future__ import annotations

import logging

from flask import Flask, jsonify, render_template

# 既存の Blueprint（/health, /ready, /v1/analyze ...）を有効化
from src.routes.img_analyze_route import img_analyze_bp
from src.utils.config import CONFIG

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-analyze-secret-key"
app.logger.setLevel(logging.INFO)


app.register_blueprint(img_analyze_bp, url_prefix="")


# プロセスが生きているかの確認用
@app.get("/health")
def health():
    # liveness: 単純に200
    return jsonify({"ok": True}), 200


# リクエストの受理が可能かの確認用
@app.get("/ready")
def ready():
    # readiness: APIキーが設定されていればOK（本番は外部依存もチェック推奨）
    return jsonify({"ready": bool(CONFIG.GEMINI_API_KEY)}), 200


@app.route("/", methods=["GET"])
def index():
    """
    テスト用のHTMLページを返すだけ。
    ページ内のスクリプトが fetch で /v1/analyze を呼び出す。
    """

    return render_template("example_image_analyze.html")


if __name__ == "__main__":
    # APIを同一プロセスで叩く必要は無いので、threaded は任意
    app.run(host="0.0.0.0", port=5001, debug=True)
