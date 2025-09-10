from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
from services.ai.analyze import analyze
from utils.config import CONFIG

img_analyze_bp = Blueprint("img_analyze", __name__)

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

@img_analyze_bp.post("/v1/analyze")
def post_analyze():
    """
    multipart/form-data:
      - file: 画像ファイル（任意）
      - image_url: 画像URL（任意）
      - question: テキスト（任意）
    file / image_url のどちらかは必須
    """
    file = request.files.get("file")
    image_url = request.form.get("image_url")
    question = request.form.get("question")

    if not file and not image_url:
        raise BadRequest("file or image_url is required")

    try:
        answer = analyze(file=file, image_url=image_url, question=question)
        return jsonify({"answer": answer}), 200
    except BadRequest as e:
        # 400/413などの入力系
        return jsonify({"error": str(e)}), e.code
    except TimeoutError as e:
        return jsonify({"error": str(e)}), 504
    except Exception as e:
        # 予期せぬエラーは502相当で返す
        return jsonify({"error": f"upstream error: {e}"}), 502
