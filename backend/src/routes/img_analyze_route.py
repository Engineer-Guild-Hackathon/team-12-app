from __future__ import annotations

from typing import Any, Dict, Tuple

from flask import Blueprint, jsonify, request
from src.services.ai.analyze import AnalyzeService
from src.services.image.image import ImageService
from werkzeug.exceptions import BadRequest

img_analyze_bp = Blueprint("img_analyze", __name__)


def _bad_request(msg: str, detail: str | None = None) -> Tuple[Any, int]:
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), 400


@img_analyze_bp.post("/v1/analyze")
def post_analyze():
    """
    multipart/form-data:
    - file: 画像ファイル（任意）
    - image_url: 画像URL（任意）
    - user_question: テキスト（任意）
    file / image_url のどちらかは必須
    """
    file = request.files.get("file")
    image_url = request.form.get("image_url")
    user_question = request.form.get("user_question")

    if not file and not image_url:
        raise BadRequest("画像ファイルまたは画像URLは必須です")

    try:
        ai_response = AnalyzeService.analyze(file=file, image_url=image_url, user_question=user_question)
        return jsonify({"ai_response": ai_response}), 200
    except BadRequest as e:
        # 400/413などの入力系
        return jsonify({"error": str(e)}), e.code
    except TimeoutError as e:
        return jsonify({"error": str(e)}), 504
    except Exception as e:
        # 予期せぬエラーは502相当で返す
        return jsonify({"error": f"upstream error: {e}"}), 502


@img_analyze_bp.post("/api/image_analyze")
def create_image_and_analyze():
    """
    画像と質問文を受け取り、以下を実施するAPI:
    1) img_id を発行して Cloud Storage + Cloud SQL に保存
    2) 保存に成功したら、gs:// と質問文をもとに Gemini を呼び出す
    3) img_analyze_route と同形式の answer に img_id を添えて返す

    リクエスト (multipart/form-data):
    - file: 画像ファイル (必須)
    - user_question: テキスト質問 (必須)

    レスポンス (200):
    {
        "img_id": "<uuid>",
        "ai_response": {
            "object_label": "...",
            "ai_answer": "...",
            "ai_question": "..."
        }
    }
    """
    # 入力取得
    if "img_file" not in request.files:
        return _bad_request("必須フィールド不足", "img_fileがありません")

    file = request.files.get("img_file")
    user_question = request.form.get("user_question", "").strip()

    if file is None:
        return _bad_request("画像ファイル(img_file)は必須です")
    if not user_question:
        return _bad_request("質問文(user_question)は必須です")

    try:
        # 1) まず画像を GCS + Cloud SQL に保存
        file_data = file.read()
        if not file_data:
            return _bad_request("空の画像データです")

        # mimetype はクライアント申告なので、必要に応じて python-magic で厳密化しても良い
        mime_type = getattr(file, "mimetype", None) or "application/octet-stream"

        saved = ImageService.save_image(file_data=file_data, mime_type=mime_type)
        if not saved:
            # 保存失敗時 (GCSアップロード or DB更新失敗)
            return jsonify({"error": "画像の保存に失敗しました"}), 502

        img_id = saved["img_id"]
        gcs_uri = saved["gcs_uri"]

        # 2) 保存に成功したので、Gemini で解析
        #    AnalyzeService.analyze は image_url に gs:// を渡せば内部でダウンロードして処理します
        ai_response = AnalyzeService.analyze(file=None, image_url=gcs_uri, user_question=user_question)

        # 3) フロントへ img_id を添えて返却（img_analyze_route に合わせて "ai_response" のみをネスト）
        return jsonify({"img_id": img_id, "ai_response": ai_response}), 200

    except BadRequest as e:
        return jsonify({"error": str(e)}), e.code
    except TimeoutError as e:
        # 上流(API)のタイムアウト扱い
        return jsonify({"error": str(e)}), 504
    except RuntimeError as e:
        # サービス初期化や外部接続の致命的エラー
        return jsonify({"error": "サービス初期化エラー", "detail": str(e)}), 503
    except Exception as e:
        # 予期しないエラーは 502 として返す
        return jsonify({"error": f"upstream error: {e}"}), 502
