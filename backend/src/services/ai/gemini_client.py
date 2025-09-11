from __future__ import annotations

import base64

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
            raise ValueError("GEMINI_API_KEY not set")

        self._client = genai.Client(api_key=api_key)
        self._model_name = model_name

    def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
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

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime)
        resp = self._client.models.generate_content(
            model=self._model_name,
            contents=[image_part, prompt],
        )
        text = getattr(resp, "text", None)
        return text or str(resp)

    def generate_b64(self, image_jpeg_b64: str, prompt: str) -> str:
        """
        Base64 文字列 → bytes に decode → Part.from_bytes で渡す
        """
        image_bytes = base64.b64decode(image_jpeg_b64)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        resp = self._client.models.generate_content(
            model=self._model_name,
            contents=[image_part, prompt],
        )
        text = getattr(resp, "text", None)
        return text or str(resp)


# シングルトン的に使えるデフォルトインスタンス
gemini = GeminiClient()
