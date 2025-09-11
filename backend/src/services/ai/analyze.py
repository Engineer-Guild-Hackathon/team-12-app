from __future__ import annotations

import base64
import io
from typing import Any, Dict

import httpx
from google import genai
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest

from services.ai.gemini_client import gemini
from utils.config import CONFIG
from utils.image_processing import downscale_to_jpeg, sniff_mime


# TODO:Dos攻撃等任意URLアクセス対策（IP制限、リクエスト数制限等）
def _fetch_image_bytes(url: str) -> bytes:
    try:
        with httpx.Client(timeout=CONFIG.HTTP_TIMEOUT, follow_redirects=True) as client:
            r = client.get(url)
            if r.status_code != 200:
                raise BadRequest("image_url fetch failed")
            return r.content
    except httpx.TimeoutException:
        raise TimeoutError("image_url fetch timeout")

# TODO: 【重要】オブジェクトで受け取れるようにする
def _build_prompt(question: str | None) -> str:
    base = (
        "この画像に写っている物体を分析して、以下のマークダウンで回答してください。\n\n"
        "## 検知した物体の名前\n"
        "[物体の名前]\n\n"
        "## はっけん\n"
        "[物体の詳細な説明、特徴、生態、用途などを含む]\n\n"
        "## 問い\n"
        "[その物体に関する興味深い質問を1つ]"
    )
    if question:
        base += f"\n\n補助質問: {question}"
    return base

def _parse_answer_to_dict(answer: str) -> Dict[str, str]:
    """
    モデルからの文字列応答をJSONとしてパースし、
    { "title": str, "discovery": str, "question": str } のdictに変換する。
    """
    import json

    from werkzeug.exceptions import BadRequest

    try:
        obj = json.loads(answer)
    except json.JSONDecodeError:
        txt = answer.strip()
        if txt.startswith("```"):
            start = txt.find("{")
            end = txt.rfind("}")
            if start != -1 and end != -1 and end > start:
                txt = txt[start : end + 1]
        obj = json.loads(txt)

    for k in ("title", "discovery", "question"):
        if k not in obj or not isinstance(obj[k], str):
            raise BadRequest("model output is not a valid JSON object with required keys")

    return obj

def _gemini_request_by_base64(
    raw: bytes | Any, prompt: str
) -> Dict[str, str]:
    # 3) 縮小＆JPEG化
    jpeg_bytes = downscale_to_jpeg(raw, max_long_edge=CONFIG.MAX_IMAGE_LONG_EDGE)

    # 4) **Base64へ変換**（APIにBase64を渡す要件）
    jpeg_b64 = base64.b64encode(jpeg_bytes).decode("utf-8")

    # 5) Gemini 呼び出し（Base64版）
    answer = gemini.generate_b64(jpeg_b64, prompt)
    return _parse_answer_to_dict(answer)

def _gemini_request_by_filesAPI(
    file: FileStorage, raw: bytes | Any, prompt: str
) -> Dict[str, str]:
    # FileStorage が来ているならそのまま stream を使う（再利用のためにシーク）
    client = genai.Client()
    display_name = getattr(file, "filename", None) or "uploaded_image"
    mime_type = getattr(file, "mimetype", None) or "image/jpeg"

    if isinstance(file, FileStorage):
        # すでに file.read() 済みなので、stream を先頭に戻してアップロード
        try:
            file.stream.seek(0)
        except Exception:
            # もしシーク不可でも raw を BytesIO に包めばOK
            pass
        upload_src = file.stream
    else:
        # URL 由来など FileStorage でない場合は BytesIO でメモリからアップロード
        upload_src = io.BytesIO(raw)

    uploaded_file = client.files.upload(
        file=upload_src,
        display_name=display_name,
        mime_type=mime_type,
    )
    response = client.models.generate_content(
        model=CONFIG.GEMINI_MODEL,
        contents=[uploaded_file, prompt],
    )
    answer = getattr(response, "text", "") or ""
    return _parse_answer_to_dict(answer)

def analyze(
    file: FileStorage | None, image_url: str | None, question: str | None
) -> Dict[str, str]:
    # 1) 画像バイトの入手
    if file is not None:
        raw = file.read()
    else:
        raw = _fetch_image_bytes(image_url)

    mime = sniff_mime(raw)
    if not mime.startswith("image/"):
        raise BadRequest("invalid image content")

    prompt = _build_prompt(question)

    # 2) サイズ/形式チェック
    # TODO: 画像サイズがあまりにも大きい場合の対応を考える
    if len(raw) <= CONFIG.B64_MAX_IMAGE_BYTES:
        return _gemini_request_by_base64(raw, prompt)

    return _gemini_request_by_filesAPI(file, raw, prompt)
