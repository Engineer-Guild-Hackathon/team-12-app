from __future__ import annotations

import logging
import os

from flask import Flask, jsonify, render_template

# 既存の Blueprint（/health, /ready, /v1/analyze ...）を有効化
from src.routes.img_analyze_route import img_analyze_bp
from src.utils.config import CONFIG


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


def create_app() -> Flask:
    app = Flask(__name__, template_folder="template")
    app.secret_key = "dev-analyze-secret-key"
    app.logger.setLevel(logging.INFO)

    # --- Blueprint 登録 ---
    # /v1/analyze, /health, /ready などは Blueprint 側で提供される
    # ここではサーバ側でフォームPOSTせず、**すべてクライアントJSからAPIを叩く**前提に統一
    app.register_blueprint(img_analyze_bp, url_prefix="")

    @app.route("/", methods=["GET"])
    def index():
        """
        テスト用のHTMLページを返すだけ。
        ページ内のスクリプトが fetch で /v1/analyze を呼び出す。
        """
        return render_template("example_image_analyze.html")

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app = create_app()
    # APIを同一プロセスで叩く必要は無いので、threaded は任意
    app.run(host="0.0.0.0", port=port, debug=True)
