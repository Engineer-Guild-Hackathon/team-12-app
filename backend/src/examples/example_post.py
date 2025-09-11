import logging

import requests
from flask import Flask, render_template
from src.routes.post_route import post_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（/posts, /posts/recent などが有効化される）
app.register_blueprint(post_bp, url_prefix="")


@app.route("/", methods=["GET"])
def index():
    posts = []
    try:
        # 自身の API を叩く: 「現在時刻から15分より前」の投稿一覧
        resp = requests.get("http://localhost:5001/posts/recent", timeout=5)
        if resp.ok:
            payload = resp.json()
            posts = payload.get("posts", [])
        else:
            app.logger.error(
                "GET /posts/recent failed: %s %s", resp.status_code, resp.text
            )
    except Exception as e:
        app.logger.exception("Failed to call /posts/recent: %s", e)

    return render_template("example_post.html", posts=posts)


if __name__ == "__main__":
    # 開発サーバ。API を同一プロセスで叩くため threaded=True が安全
    app.run(host="0.0.0.0", port=5001, debug=True, threaded=True)
