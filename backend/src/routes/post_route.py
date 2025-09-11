import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from src.services.post.post import PostService

post_bp = Blueprint("post_bp", __name__)


# --- DTO (Data Transfer Object) ---
@dataclass(frozen=True)
class CreatePostDTO:
    post_id: uuid.UUID
    user_id: uuid.UUID
    img_id: uuid.UUID
    question: str
    answer: str
    toi: str
    location: str


# --- ヘルパー関数 ---
def _bad_request(msg: str, detail: str | None = None):
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), 400


def _get_request_data() -> Dict[str, Any]:
    """リクエストボディを dict 化"""
    ctype = (request.content_type or "").lower()
    if "application/json" in ctype:
        return request.get_json(silent=True) or {}
    if "application/x-www-form-urlencoded" in ctype or "multipart/form-data" in ctype:
        # フォーム → dict 化（値は文字列）
        return {k: v for k, v in request.form.items()}
    # Content-Type が不明でも JSON を試す
    return request.get_json(silent=True) or {}


def _parse_create_post_payload(data: Dict[str, Any]) -> CreatePostDTO:
    """入力バリデーション"""
    # 必須キー
    required = ("post_id", "user_id", "img_id", "question", "answer", "toi", "location")
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"必須フィールド不足: {', '.join(missing)}")
    try:
        post_id = uuid.UUID(str(data["post_id"]))
        user_id = uuid.UUID(str(data["user_id"]))
        img_id = uuid.UUID(str(data["img_id"]))
    except Exception as e:
        raise ValueError(f"post_id / user_id / img_id はUUID形式: {e}")
    for key in ("question", "answer", "toi", "location"):
        v = data.get(key)
        if not isinstance(v, str) or not v:
            raise ValueError(f"{key} は空でない文字列を指定")
    return CreatePostDTO(
        post_id=post_id,
        user_id=user_id,
        img_id=img_id,
        question=data["question"],
        answer=data["answer"],
        toi=data["toi"],
        location=data["location"],
    )


def _parse_iso8601(ts: str) -> datetime:
    """
    ISO 8601/RFC3339っぽい文字列をdatetime(TZ付き)に変換。
    'Z' は +00:00 として扱う。
    """
    s = ts.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except Exception as e:
        raise ValueError(f"時刻の形式が不正です: {ts} ({e})")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


@post_bp.route("/posts", methods=["POST"])
def create_post():
    """投稿を新規作成"""
    data = _get_request_data()
    if not data:
        return _bad_request("リクエストボディが空です")
    try:
        dto = _parse_create_post_payload(data)
    except ValueError as e:
        return _bad_request("入力エラー", str(e))
    try:
        created = PostService.create_post(
            post_id=dto.post_id,
            user_id=dto.user_id,
            img_id=dto.img_id,
            question=dto.question,
            answer=dto.answer,
            toi=dto.toi,
            location=dto.location,
        )
        if created is None:
            return jsonify({"error": "保存に失敗しました"}), 500
        return jsonify({"post": created}), 201
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/posts/<uuid:post_id>", methods=["GET"])
def get_post(post_id: uuid.UUID):
    """post_id(UUID) で1件取得"""
    try:
        post = PostService.get_post(post_id)
        if post is None:
            return jsonify({"error": "指定された投稿は存在しません"}), 404
        return jsonify({"post": post}), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/posts", methods=["GET"])
def list_posts():
    """投稿一覧を取得（ページング対応）"""
    try:
        limit = int(request.args.get("limit", "10"))
        offset = int(request.args.get("offset", "0"))
        if limit < 1 or limit > 100:
            return _bad_request("limit は 1〜100 の範囲で指定してください")
        if offset < 0:
            return _bad_request("offset は 0 以上で指定してください")
    except ValueError:
        return _bad_request("limit / offset は整数で指定してください")
    try:
        posts = PostService.list_posts(limit=limit, offset=offset)
        return jsonify({"posts": posts, "limit": limit, "offset": offset}), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/posts/recent", methods=["GET"])
def list_recent_posts():
    """現在時刻から15分前より前に作成された投稿一覧を取得"""
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=15)

        # cutoff よりも古い投稿を取得
        posts = PostService.list_posts_before(cutoff)
        return jsonify(
            {
                "posts": posts,
                "before": cutoff.isoformat(),
                "now": now.isoformat(),
            }
        ), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/posts/<uuid:post_id>", methods=["DELETE"])
def delete_post(post_id: uuid.UUID):
    """投稿を削除"""
    try:
        deleted = PostService.delete_post(post_id)
        if not deleted:
            return jsonify({"error": "指定された投稿は存在しません"}), 404
        return jsonify({"status": "deleted", "post_id": str(post_id)}), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503
