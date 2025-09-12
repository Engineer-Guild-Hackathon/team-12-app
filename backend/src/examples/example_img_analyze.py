from __future__ import annotations

import logging
import os

from flask import Flask, render_template

# 既存の Blueprint（/health, /ready, /v1/analyze ...）を有効化
from src.routes.img_analyze_route import img_analyze_bp


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
        return render_template("example_img_analyze.html")

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app = create_app()
    # APIを同一プロセスで叩く必要は無いので、threaded は任意
    app.run(host="0.0.0.0", port=port, debug=True)
