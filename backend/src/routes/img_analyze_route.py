from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from flask import Blueprint, jsonify, request
from geopy.geocoders import Nominatim
from src.services.ai.analyze import AnalyzeService
from src.services.image.image import ImageService
from timezonefinder import TimezoneFinder
from werkzeug.exceptions import BadRequest
from zoneinfo import ZoneInfo

img_analyze_bp = Blueprint("img_analyze", __name__)


def _bad_request(msg: str, detail: str | None = None) -> Tuple[Any, int]:
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), 400


def _reverse_geocode_location(lat: float, lon: float) -> str | None:
    """緯度経度から日本語住所を取得（失敗時は None を返す）。

    - Nominatim を利用
    - 例外は握りつぶして None を返す
    """
    try:
        geolocator = Nominatim(user_agent="image_analyze_geocoder")
        loc = geolocator.reverse((lat, lon), language="ja")
        if loc:
            return loc.address
    except Exception:
        pass
    return None


def _get_location_and_time(lat: float, lon: float) -> Tuple[str, str]:
    location_text: str | None = None
    local_time_iso: str | None = None

    if lat is not None and lon is not None:
        try:
            lat = float(lat)
            lon = float(lon)
            if not (-90.0 <= lat <= 90.0):
                raise ValueError("latitude は -90〜90 の範囲で指定してください")
            if not (-180.0 <= lon <= 180.0):
                raise ValueError("longitude は -180〜180 の範囲で指定してください")

            # 逆ジオコーディング（失敗時は None のまま）
            location_text = _reverse_geocode_location(lat, lon)

            # タイムゾーン取得とローカル時刻
            try:
                tf = TimezoneFinder()
                tzname = tf.timezone_at(lat=lat, lng=lon)
                if tzname:
                    now_local = datetime.now(ZoneInfo(tzname))
                else:
                    now_local = datetime.now(timezone.utc)
                local_time_iso = now_local.isoformat()
            except Exception:
                local_time_iso = datetime.now(timezone.utc).isoformat()
        except ValueError as e:
            # 緯度経度が不正でも、解析自体は継続する（プロンプト拡張なし）
            print(f"WARN: invalid lat/lon for analyze prompt: {e}")

    return location_text, local_time_iso


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
    3) img_analyze_route と同形式の ai_response に img_id を添えて返す

    リクエスト (multipart/form-data):
    - file: 画像ファイル (必須)
    - user_question: テキスト質問 (必須)
    - latitude: 緯度 (任意: 解析の文脈付与用)
    - longitude: 経度 (任意: 解析の文脈付与用)

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
    lat_raw = request.form.get("latitude")
    lon_raw = request.form.get("longitude")

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

        # 2) 位置情報の逆ジオコーディングとローカル時刻の算出（任意）
        location_text, local_time_iso = _get_location_and_time(lat_raw, lon_raw)

        # 3) 保存に成功したので、Gemini で解析
        #    AnalyzeService.analyze は image_url に gs:// を渡せば内部でダウンロードして処理します
        ai_response = AnalyzeService.analyze(
            file=None,
            image_url=gcs_uri,
            user_question=user_question,
            location=location_text,
            local_time_iso=local_time_iso,
        )

        # 4) フロントへ img_id と location を添えて返却
        return jsonify({"img_id": img_id, "ai_response": ai_response, "location": location_text}), 200

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
