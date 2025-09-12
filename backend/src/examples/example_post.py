import logging
import uuid

import requests
from flask import Flask, render_template, request
from src.routes.post_route import post_bp

app = Flask(__name__, template_folder="template")
app.secret_key = "dev"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（/posts, /posts/recent などが有効化される）
app.register_blueprint(post_bp, url_prefix="")


def _default_form_values():
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
    """投稿フォームと最近の投稿一覧を表示"""
    form_defaults = _default_form_values()
    for k in form_defaults.keys():
        if k in request.args:
            # クエリ指定があれば上書き（lat/lng は float 化）
            if k in ("latitude", "longitude"):
                try:
                    form_defaults[k] = float(request.args[k])
                except Exception:
                    pass
            else:
                form_defaults[k] = request.args[k]
    posts = []
    try:
        # 自身の API: 「現在時刻から15分より前」の投稿一覧
        resp = requests.get("http://localhost:5001/api/posts/recent", timeout=5)
        if resp.ok:
            payload = resp.json()
            posts = payload.get("posts", [])
        else:
            app.logger.error("GET /posts/recent failed: %s %s", resp.status_code, resp.text)
    except Exception as e:
        app.logger.exception("Failed to call /api/posts/recent: %s", e)

    return render_template("example_post.html", posts=posts, form=form_defaults)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True, threaded=True)
