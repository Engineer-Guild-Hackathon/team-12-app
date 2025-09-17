from __future__ import annotations

import logging

from flask import Flask, render_template
from src.routes.image_route import image_bp
from src.routes.img_analyze_route import img_analyze_bp

app = Flask(__name__, template_folder="template")

app.secret_key = "dev-analyze-secret-key"
app.logger.setLevel(logging.INFO)

app.register_blueprint(image_bp, url_prefix="")
app.register_blueprint(img_analyze_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    """
    テスト用のHTMLページを返すだけ。
    ページ内のスクリプトが fetch で /v1/analyze を呼び出す。
    """
    return render_template("example_image_analyze_v2.html")


if __name__ == "__main__":
    # APIを同一プロセスで叩く必要は無いので、threaded は任意
    app.run(host="0.0.0.0", port=5001, debug=True)
