from __future__ import annotations

import base64
import io
import json
from typing import Any, Dict

import httpx
from google import genai
from google.genai import types
from src.services.ai.gemini_client import gemini
from src.utils.config import CONFIG
from src.utils.image_processing import downscale_to_jpeg, sniff_mime
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest


class AnalyzeService:
    """画像解析をGemini APIで実行するサービスクラス"""

    @staticmethod
    def analyze(file: FileStorage | None, image_url: str | None, question: str | None) -> Dict[str, str]:
        """
        画像を解析してAIからの回答を返す

        Args:
            file: アップロードされた画像ファイル
            image_url: 画像のURL
            question: 補助的な質問

        Returns:
            {"title": str, "discovery": str, "question": str} の辞書

        Raises:
            BadRequest: 無効な画像やリクエスト
            TimeoutError: 画像取得のタイムアウト
        """
        # 1) 画像バイトの入手
        if file is not None:
            raw = file.read()
        else:
            raw = AnalyzeService._fetch_image_bytes(image_url)

        # 2) 画像形式の検証
        mime = sniff_mime(raw)
        if not mime.startswith("image/"):
            raise BadRequest("画像ファイルではありません")

        # 3) プロンプトの構築
        prompt = AnalyzeService._build_prompt(question)

        # 4) 画像サイズに応じてAPIを選択
        if len(raw) <= CONFIG.B64_MAX_IMAGE_BYTES:
            return AnalyzeService._gemini_request_by_base64(raw, prompt)
        else:
            return AnalyzeService._gemini_request_by_filesAPI(file, raw, prompt)

    @staticmethod
    def _fetch_image_bytes(url: str) -> bytes:
        """
        URLから画像データを取得する

        Args:
            url: 画像のURL

        Returns:
            画像のバイトデータ

        Raises:
            BadRequest: HTTPエラー
            TimeoutError: タイムアウト
        """
        # TODO: DoS攻撃等任意URLアクセス対策（IP制限、リクエスト数制限等）
        try:
            with httpx.Client(timeout=CONFIG.HTTP_TIMEOUT, follow_redirects=True) as client:
                r = client.get(url)
                if r.status_code != 200:
                    raise BadRequest("画像URLからの取得に失敗しました")
                return r.content
        except httpx.TimeoutException:
            raise TimeoutError("image_url fetch timeout")

    @staticmethod
    def _build_prompt(question: str | None) -> str:
        """
        モデルに「厳密にJSONのみ」を返させるプロンプトを構築する

        Args:
            question: 補助的な質問（オプション）

        Returns:
            構築されたプロンプト文字列
        """
        base = (
            "あなたは画像の内容を日本語で説明するアシスタントです。以下のJSONスキーマに厳密に従い、"
            "出力は JSON のみ（前後の説明文・コードフェンス・Markdown見出しなど一切禁止）で返してください。\n\n"
            "出力フォーマット（例）:\n"
            "{\n"
            '  "title": "検知した物体の名前（簡潔に1つ）",\n'
            '  "discovery": "物体の詳細な説明・特徴・生態・用途など（日本語で数文）",\n'
            '  "question": "その物体に関する興味深い問いを1つ（日本語）"\n'
            "}\n\n"
            "制約:\n"
            "- フィールド名は必ず title / discovery / question。\n"
            "- すべて文字列。改行はそのまま文字列内に含めてよい。\n"
            "- JSON以外のテキスト・コードブロック・Markdown記法は禁止。\n"
        )
        if question:
            base += f"\n補助質問（考慮してよいが、出力は上記JSONのみ）: {question}\n"
        return base

    @staticmethod
    def _parse_answer_to_dict(answer: str) -> Dict[str, str]:
        """
        モデルからの文字列応答をJSONとしてパースし、辞書に変換する

        Args:
            answer: モデルからの応答文字列

        Returns:
            {"title": str, "discovery": str, "question": str} の辞書

        Raises:
            BadRequest: 無効なJSON形式
        """
        try:
            obj = json.loads(answer)
        except json.JSONDecodeError:
            # コードブロック形式の場合の処理
            txt = answer.strip()
            if txt.startswith("```"):
                start = txt.find("{")
                end = txt.rfind("}")
                if start != -1 and end != -1 and end > start:
                    txt = txt[start : end + 1]
            obj = json.loads(txt)

        # 必須フィールドの検証
        for k in ("title", "discovery", "question"):
            if k not in obj or not isinstance(obj[k], str):
                raise BadRequest("AIの出力が必要なJSON形式（title, discovery, questionの各文字列）になっていません")

        return obj

    @staticmethod
    def _gemini_request_by_base64(raw: bytes | Any, prompt: str) -> Dict[str, str]:
        """
        Base64エンコードした画像でGemini APIを呼び出す（小さい画像用）

        Args:
            raw: 画像のバイトデータ
            prompt: プロンプト文字列

        Returns:
            解析結果の辞書
        """
        # 画像の縮小とJPEG化
        jpeg_bytes = downscale_to_jpeg(raw, max_long_edge=CONFIG.MAX_IMAGE_LONG_EDGE)

        # Base64エンコード
        jpeg_b64 = base64.b64encode(jpeg_bytes).decode("utf-8")

        # Gemini API呼び出し
        answer = gemini.generate_b64(jpeg_b64, prompt)
        return AnalyzeService._parse_answer_to_dict(answer)

    @staticmethod
    def _gemini_request_by_filesAPI(file: FileStorage, raw: bytes | Any, prompt: str) -> Dict[str, str]:
        """
        Files APIを使用してGemini APIを呼び出す（大きい画像用）

        Args:
            file: ファイルストレージオブジェクト
            raw: 画像のバイトデータ
            prompt: プロンプト文字列

        Returns:
            解析結果の辞書
        """
        client = genai.Client()
        display_name = getattr(file, "filename", None) or "uploaded_image"
        mime_type = getattr(file, "mimetype", None) or "image/jpeg"

        # 構造化出力（JSON強制）設定
        try:
            JSON_SCHEMA = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "title": types.Schema(type=types.Type.STRING),
                    "discovery": types.Schema(type=types.Type.STRING),
                    "question": types.Schema(type=types.Type.STRING),
                },
                required=["title", "discovery", "question"],
            )
            GENCFG_JSON = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
            )
        except Exception:
            # 古いSDK等で未対応の場合はNoneにしてプロンプトのみで運用
            GENCFG_JSON = None

        # ファイルストリームの準備
        if isinstance(file, FileStorage):
            # 既にfile.read()済みなので、streamを先頭に戻してアップロード
            try:
                file.stream.seek(0)
            except Exception:
                # シーク不可でもrawをBytesIOに包めばOK
                pass
            upload_src = file.stream
        else:
            # URL由来などFileStorageでない場合はBytesIOでメモリからアップロード
            upload_src = io.BytesIO(raw)

        # ファイルアップロード
        uploaded_file = client.files.upload(
            file=upload_src,
            display_name=display_name,
            mime_type=mime_type,
        )

        # API呼び出し
        kwargs = {}
        if GENCFG_JSON is not None:
            kwargs["config"] = GENCFG_JSON
        response = client.models.generate_content(
            model=CONFIG.GEMINI_MODEL,
            contents=[uploaded_file, prompt],
            **kwargs,
        )
        answer = getattr(response, "text", "") or ""
        return AnalyzeService._parse_answer_to_dict(answer)


def analyze(file: FileStorage | None, image_url: str | None, question: str | None) -> Dict[str, str]:
    return AnalyzeService.analyze(file, image_url, question)
