from flask import Flask, jsonify
from src.routes.image_route import image_bp
from src.routes.img_analyze_route import img_analyze_bp
from src.routes.post_route import post_bp
from src.utils.config import CONFIG

app = Flask(__name__)

app.register_blueprint(post_bp)
app.register_blueprint(img_analyze_bp)
app.register_blueprint(image_bp)


# プロセスが生きているかの確認用
@img_analyze_bp.get("/health")
def health():
    # liveness: 単純に200
    return jsonify({"ok": True}), 200


# リクエストの受理が可能かの確認用
@img_analyze_bp.get("/ready")
def ready():
    # readiness: APIキーが設定されていればOK（本番は外部依存もチェック推奨）
    return jsonify({"ready": bool(CONFIG.GEMINI_API_KEY)}), 200


@app.route("/")
def hello():
    return "Hello World"


if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0", port=5000)
