from __future__ import annotations

import json

from google import genai
from google.genai import types
from src.utils.config import CONFIG
from werkzeug.datastructures import FileStorage


# 単純ラッパ：bytes(JPEG) + prompt を投げて text を返す
class GeminiClient:
    def __init__(self, api_key: str | None = None, model_name: str | None = None):
        api_key = api_key or CONFIG.GEMINI_API_KEY
        model_name = model_name or CONFIG.GEMINI_MODEL
        if not api_key:
            raise ValueError("GEMINI_API_KEYが設定されていません")

        self._client = genai.Client(api_key=api_key)
        self._model_name = model_name

        # --- 構造化出力（JSON強制）の設定を試みる ---
        self._gencfg_json = None  # 例外キャッチのため
        try:
            JSON_SCHEMA = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "object_label": types.Schema(type=types.Type.STRING),
                    "ai_answer": types.Schema(type=types.Type.STRING),
                    "ai_question": types.Schema(type=types.Type.STRING),
                },
                required=["object_label", "ai_answer", "ai_question"],
            )
            self._gencfg_json = types.GenerateContentConfig(
                # response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
                tools=[types.Tool(google_search=types.GoogleSearch())],
            )
        except Exception:
            # この例外は想定していない
            # 古いSDKなどで未対応の場合はプロンプトのみで運用（_build_prompt がJSONを強制）
            self._gencfg_json = None

    # 現在使用していない
    def generate_file_storage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        """
        FileStorage(Flask/Werkzeug) を一時保存なしでメモリ読み込み → Part.from_bytes で渡す
        """
        # すでにどこかで read 済みの可能性に備え、seek(0)
        try:
            image_jpeg_file.stream.seek(0)
            image_bytes = image_jpeg_file.stream.read()
        except Exception:
            # fallback: FileStorage 自体の read
            image_bytes = image_jpeg_file.read()

        mime = getattr(image_jpeg_file, "mimetype", None) or "image/jpeg"
        return self.generate_inline(image_bytes, prompt, mime)

    def generate_inline(self, image_jpeg_bytes: bytes, prompt: str, mime: str = "image/jpeg") -> str:  # noqa: C901
        """
        bytes → Part.from_bytes で渡す
        """
        image_part = types.Part.from_bytes(data=image_jpeg_bytes, mime_type=mime)
        kwargs = {}
        if self._gencfg_json:
            kwargs["config"] = self._gencfg_json

        resp = self._client.models.generate_content(
            model=self._model_name,
            contents=[image_part, prompt],
            **kwargs,
        )

        # 可能ならグラウンディングURL（最初の1件）を抽出
        # Gemini APIのレスポンス（resp）はJSON文字列
        # 必要項目: object_label, ai_answer, ai_question（全てstr）＋ grounding_urls（string[]）

        grounding_urls = []

        try:
            # candidates と groundingMetadata の取得
            candidates = getattr(resp, "candidates", [])
            for cand in candidates:
                gm = cand.get("groundingMetadata")
                if gm:
                    # citations から URL を取得
                    citations = gm.get("citations", [])
                    for c in citations:
                        uri = c.get("uri")
                        if isinstance(uri, str) and uri.startswith("http"):
                            grounding_urls.append(uri)

                    # grounding_chunks から URL を取得（citations がなかった場合）
                    if not grounding_urls:
                        chunks = gm.get("groundingChunks", [])
                        for ch in chunks:
                            web = ch.get("web")
                            if web:
                                uri = web.get("uri")
                                if isinstance(uri, str) and uri.startswith("http"):
                                    grounding_urls.append(uri)

        except Exception:
            grounding_urls = []

        # レスポンステキスト取得・grounding_urls追加して文字列で返す
        try:
            obj = json.loads(getattr(resp, "text", "") or "")
            if isinstance(obj, dict):
                obj["grounding_urls"] = grounding_urls  # grounding_urls を追加
                result = json.dumps(obj, ensure_ascii=False)
            else:
                result = getattr(resp, "text", "") or str(resp)
        except Exception:
            result = getattr(resp, "text", "") or str(resp)

        return result


# シングルトン的に使えるデフォルトインスタンス
gemini = GeminiClient()
