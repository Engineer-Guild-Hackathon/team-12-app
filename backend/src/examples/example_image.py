import logging
import os

from flask import Flask, render_template
from src.routes.image_route import image_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-image-secret-key-very-safe"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（/images, /images/<img_id> などが有効化される）
app.register_blueprint(image_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    """
    テスト用のHTMLページをレンダリングして返す。
    API呼び出しはすべてクライアントサイドのJavaScriptが行う。
    """
    return render_template("example_image.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
