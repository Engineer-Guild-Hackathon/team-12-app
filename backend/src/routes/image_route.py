import uuid
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from src.services.image.image import ImageService

image_bp = Blueprint("image_bp", __name__)


# --- ヘルパー関数 ---
def _bad_request(msg: str, detail: str | None = None) -> tuple[Any, int]:
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), 400


@image_bp.route("/api/images", methods=["POST"])
def save_image():
    """画像を新規アップロード"""
    if "img_file" not in request.files:
        return _bad_request("必須フィールド不足", "img_fileがありません")

    file = request.files["img_file"]
    if not file or file.filename == "":
        return _bad_request("ファイルが空です")

    # Pillowなどを使ったより厳密な検証をサービス層で行うのが望ましい
    if not (file.mimetype and file.mimetype.startswith("image/")):
        return _bad_request("ファイル形式が不正です", "画像ファイルを指定してください")

    try:
        # サービス層を呼び出し
        file_data = file.read()
        created = ImageService.save_image(
            file_data=file_data,
            mime_type=file.mimetype,
        )
        if created is None:
            return jsonify({"error": "画像の保存に失敗しました"}), 500
        return jsonify({"image": created}), 201

    except RuntimeError as e:
        return jsonify({"error": "サービス初期化エラー", "detail": str(e)}), 503
    except Exception as e:
        return jsonify({"error": "予期せぬエラーが発生しました", "detail": str(e)}), 500


@image_bp.route("/api/images/<uuid:img_id>", methods=["GET"])
def get_image(img_id: uuid.UUID):
    """img_id(UUID)で画像情報（署名付きURL含む）を1件取得"""
    try:
        image = ImageService.get_image(img_id)
        if image is None:
            return jsonify(
                {"error": "指定された画像は存在しないか、保存処理に失敗しています"}
            ), 404
        return jsonify({"image": image}), 200
    except RuntimeError as e:
        return jsonify({"error": "サービス初期化エラー", "detail": str(e)}), 503


@image_bp.route("/api/images/<uuid:img_id>", methods=["DELETE"])
def delete_image(img_id: uuid.UUID):
    """画像を削除"""
    try:
        deleted = ImageService.delete_image(img_id)
        if not deleted:
            return jsonify({"error": "指定された画像は存在しません"}), 404
        return jsonify({"status": "deleted", "img_id": str(img_id)}), 200
    except RuntimeError as e:
        return jsonify({"error": "サービス初期化エラー", "detail": str(e)}), 503
