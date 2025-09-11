import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from geopy.geocoders import Nominatim

from src.services.post.post import PostService

post_bp = Blueprint("post_bp", __name__)


@dataclass(frozen=True)
class CreatePostDTO:
    """Data Transfer Object"""

    post_id: uuid.UUID
    user_id: uuid.UUID
    img_id: uuid.UUID
    question: str
    target: str
    answer: str
    toi: str
    location: str
    latitude: float
    longitude: float


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
        return {k: v for k, v in request.form.items()}
    return request.get_json(silent=True) or {}


def _reverse_geocode(lat: float, lon: float) -> str:
    geolocator = Nominatim(user_agent="my_geocoder")
    location = geolocator.reverse((lat, lon), language="ja")
    if location:
        return location.address
    return "不明な場所"


def _parse_float(name: str, v: Any) -> float:
    try:
        return float(v)
    except Exception:
        raise ValueError(f"{name} は数値で指定してください")


def _parse_create_post_payload(data: Dict[str, Any]) -> CreatePostDTO:
    """入力バリデーション（DDL準拠）"""
    required = (
        "post_id",
        "user_id",
        "img_id",
        "question",
        "target",
        "answer",
        "toi",
        "location",
        "latitude",
        "longitude",
    )
    missing = [k for k in required if k not in data]
    if missing:
        raise ValueError(f"必須フィールド不足: {', '.join(missing)}")

    # UUID
    try:
        post_id = uuid.UUID(str(data["post_id"]))
        user_id = uuid.UUID(str(data["user_id"]))
        img_id = uuid.UUID(str(data["img_id"]))
    except Exception as e:
        raise ValueError(f"post_id / user_id / img_id はUUID形式: {e}")

    # 文字列必須
    for key in ("question", "target", "answer", "toi", "location"):
        v = data.get(key)
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"{key} は空でない文字列を指定")

    # 数値 + 値域
    lat = _parse_float("latitude", data.get("latitude"))
    lng = _parse_float("longitude", data.get("longitude"))
    if not (-90.0 <= lat <= 90.0):
        raise ValueError("latitude は -90〜90 の範囲で指定してください")
    if not (-180.0 <= lng <= 180.0):
        raise ValueError("longitude は -180〜180 の範囲で指定してください")

    return CreatePostDTO(
        post_id=post_id,
        user_id=user_id,
        img_id=img_id,
        question=data["question"].strip(),
        target=data["target"].strip(),
        answer=data["answer"].strip(),
        toi=data["toi"].strip(),
        location=data["location"].strip(),
        latitude=lat,
        longitude=lng,
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


@post_bp.route("/api/posts", methods=["POST"])
def create_post():
    """投稿を新規作成"""
    data = _get_request_data()
    if not data:
        return _bad_request("リクエストボディが空です")
    try:
        # post_id を作成
        data["post_id"] = str(uuid.uuid4())
        # 位置情報の住所を逆ジオコーディングで取得して補完
        location = _reverse_geocode(data["latitude"], data["longitude"])
        data["location"] = location
        # 入力バリデーション
        dto = _parse_create_post_payload(data)
    except ValueError as e:
        return _bad_request("入力エラー", str(e))

    try:
        created = PostService.create_post(
            post_id=dto.post_id,
            user_id=dto.user_id,
            img_id=dto.img_id,
            question=dto.question,
            target=dto.target,
            answer=dto.answer,
            toi=dto.toi,
            location=dto.location,
            latitude=dto.latitude,
            longitude=dto.longitude,
        )
        if created is None:
            return jsonify({"error": "保存に失敗しました"}), 500
        return jsonify({"post": created}), 201
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/api/posts/<uuid:post_id>", methods=["GET"])
def get_post(post_id: uuid.UUID):
    """post_id(UUID) で1件取得"""
    try:
        post = PostService.get_post(post_id)
        if post is None:
            return jsonify({"error": "指定された投稿は存在しません"}), 404
        return jsonify({"post": post}), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/api/posts", methods=["GET"])
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


@post_bp.route("/api/posts/recent", methods=["GET"])
def list_recent_posts():
    """現在時刻から15分前より前に作成された投稿一覧を取得"""
    try:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=15)
        posts = PostService.list_posts_before(cutoff)
        return jsonify(
            {"posts": posts, "before": cutoff.isoformat(), "now": now.isoformat()}
        ), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503


@post_bp.route("/api/posts/<uuid:post_id>", methods=["DELETE"])
def delete_post(post_id: uuid.UUID):
    """投稿を削除"""
    try:
        deleted = PostService.delete_post(post_id)
        if not deleted:
            return jsonify({"error": "指定された投稿は存在しません"}), 404
        return jsonify({"status": "deleted", "post_id": str(post_id)}), 200
    except RuntimeError as e:
        return jsonify({"error": "DB初期化エラー", "detail": str(e)}), 503
