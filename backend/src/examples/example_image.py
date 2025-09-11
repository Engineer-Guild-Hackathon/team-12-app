import logging
import os

from flask import Flask, render_template

# image_route.pyで定義されたBlueprintをインポート
from src.routes.image_route import image_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-image-secret-key-very-safe"
app.logger.setLevel(logging.INFO)

# --- Blueprint 登録 ---
# /api/images, /api/images/<img_id> などのエンドポイントが有効になる
# 【重要】url_prefixを '/api' に設定
app.register_blueprint(image_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    """
    テスト用のHTMLページをレンダリングして返す。
    API呼び出しはすべてクライアントサイドのJavaScriptが行う。
    """
    return render_template("example_image.html")


# --- サーバー起動 ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    # APIを同一プロセスで叩く必要がなくなったため、threaded=Trueは必須ではない
    app.run(host="0.0.0.0", port=port, debug=True)
