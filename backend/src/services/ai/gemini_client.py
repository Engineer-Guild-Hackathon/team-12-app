from __future__ import annotations

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
                response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
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

    def generate_inline(self, image_jpeg_bytes: bytes, prompt: str, mime: str = "image/jpeg") -> str:
        """
        bytes → Part.from_bytes で渡す
        """
        image_part = types.Part.from_bytes(data=image_jpeg_bytes, mime_type=mime)
        kwargs = {}
        if self._gencfg_json is not None:
            kwargs["config"] = self._gencfg_json
        resp = self._client.models.generate_content(
            model=self._model_name,
            contents=[image_part, prompt],
            **kwargs,
        )
        text = getattr(resp, "text", None)
        return text or str(resp)


# シングルトン的に使えるデフォルトインスタンス
gemini = GeminiClient()
