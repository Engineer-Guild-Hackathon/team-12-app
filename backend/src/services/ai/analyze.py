from __future__ import annotations

import io
import json
import unicodedata
from typing import Any, Dict, Union
from urllib.parse import unquote

import magic
from google import genai
from google.cloud import storage
from google.genai import types
from PIL import Image
from src.services.ai.gemini_client import gemini
from src.utils.config import CONFIG
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest


class AnalyzeService:
    """画像解析をGemini APIで実行するサービスクラス"""

    @staticmethod
    def analyze(
        file: FileStorage | None, image_url: str | None, user_question: str | None
    ) -> Dict[str, Union[str, list[str]]]:
        """
        画像を解析してAIからの回答を返す

        Args:
            file: アップロードされた画像ファイル
            image_url: 画像のURL
            user_question: 補助的な質問

        Returns:
            {"object_label": str, "ai_answer": str, "ai_question": str, "grounding_urls": list[str]} の辞書

        Raises:
            BadRequest: 無効な画像やリクエスト
            TimeoutError: 画像取得のタイムアウト
        """
        # 1) 画像バイトの入手
        if file is not None:
            raw = file.read()
        else:
            raw = AnalyzeService._fetch_image_bytes(image_url)

        # 空データは即時エラー（sniff_mime が x-empty を返す前に止める）
        if not raw:
            raise BadRequest("画像データが空です（0 byte）")

        # 2) 画像形式の検証
        mime = AnalyzeService.sniff_mime(raw)
        if not mime.startswith("image/"):
            raise BadRequest("画像ファイルではありません")

        # 3) プロンプトの構築
        prompt = AnalyzeService._build_prompt(user_question)

        # 4) 画像サイズに応じてAPIを選択
        if len(raw) <= CONFIG.INLINE_MAX_IMAGE_BYTES:
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
        if not url.startswith("gs://"):
            raise BadRequest("対応していないURLです。gs:// 形式のGCS URLのみ対応しています。")
        return AnalyzeService._fetch_gcs_bytes(url)

    @staticmethod
    def _fetch_gcs_bytes(gs_url: str) -> bytes:
        """
        Google Cloud Storage からバイト列を取得（gs://bucket/path/to/object）
        """
        if not gs_url.startswith("gs://"):
            raise BadRequest("invalid gs url scheme")

        # 前後の空白や引用符を除去
        gs_url_clean = gs_url.strip().strip('"').strip("'")
        rest = gs_url_clean[5:]
        try:
            bucket_name, blob_name = rest.split("/", 1)
        except ValueError:
            raise BadRequest("invalid gs url format")

        blob_name_unquoted = unquote(blob_name)
        blob_name_norm = unicodedata.normalize("NFC", blob_name_unquoted)

        # フォルダ（末尾/）はエラー
        if blob_name_norm.endswith("/"):
            raise BadRequest("GCSパスがフォルダを指しています（末尾/）。ファイル名まで指定してください。")

        client = storage.Client(project=CONFIG.GCP_PROJECT_ID)
        blob = client.bucket(bucket_name).blob(blob_name_norm)

        # ここでダウンロード → 例外で NotFound/権限なし等を拾える
        try:
            data = blob.download_as_bytes()
        except Exception as e:
            raise BadRequest(f"GCSからのダウンロードに失敗しました: {e}")

        if not data:
            raise BadRequest("GCSから空データを受信しました")

        return data

    @staticmethod
    def sniff_mime(raw: bytes) -> str:
        """
        バイト列から MIME を推定する。未検出時は 'application/octet-stream'。
        """
        mime = magic.from_buffer(raw, mime=True)
        return mime or "application/octet-stream"

    @staticmethod
    def downscale_to_jpeg(raw: bytes, max_long_edge: int = 1600, quality: int = 90) -> bytes:
        """
        任意の画像バイトを長辺 max_long_edge に収めつつ JPEG に再エンコードして返す。
        """
        with Image.open(io.BytesIO(raw)) as im:
            im = im.convert("RGB")
            w, h = im.size
            long_edge = max(w, h)
            if long_edge > max_long_edge:
                scale = max_long_edge / long_edge
                new_size = (int(w * scale), int(h * scale))
                im = im.resize(new_size)
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=quality)
            return buf.getvalue()

    @staticmethod
    def _build_prompt(user_question: str | None) -> str:
        """
        モデルに「厳密にJSONのみ」を返させるプロンプトを構築する

        Args:
            user_question: 補助的な質問（オプション）

        Returns:
            構築されたプロンプト文字列
        """
        base = (
            "あなたは画像の内容を日本語で説明するアシスタントです。以下のJSONスキーマに厳密に従い、"
            "出力は JSON のみ（前後の説明文・コードフェンス・Markdown見出しなど一切禁止）で返してください。\n\n"
            "出力フォーマット（例）:\n"
            "{\n"
            '  "object_label": "検知した物体の名前（簡潔に1つ）",\n'
            '  "ai_answer": "物体の詳細な説明・特徴・生態・用途など（日本語で数文）",\n'
            '  "ai_question": "その物体に関する興味深い問いを1つ（日本語）"\n'
            "}\n\n"
            "制約:\n"
            "- フィールド名は必ず object_label / ai_answer / ai_question。\n"
            "- すべて文字列。改行はそのまま文字列内に含めてよい。\n"
            "- JSON以外のテキスト・コードブロック・Markdown記法は禁止。\n"
            "- ユーザーからの補助質問に「検索して」などの指示がなくても、グラウンディング（Web検索）を行ったほうが良いと判断したときはグラウンディングを行ってください。\n"
            "- グラウンディングを行った場合は、グラウンディングのURL(検索に用いた情報)をgrounding_urlsに含めてください。\n"
        )
        if user_question:
            base += f"\n補助質問（考慮してよいが、出力は上記JSONのみ）: {user_question}\n"
        return base

    @staticmethod
    def _parse_answer_to_dict(ai_response: str) -> Dict[str, Union[str, list[str]]]:
        """
        モデルからの文字列応答をJSONとしてパースし、辞書に変換する

        Args:
            ai_response: モデルからの応答文字列

        Returns:
            {"object_label": str, "ai_answer": str, "ai_question": str, "grounding_urls": list[str]} の辞書

        Raises:
            BadRequest: 無効なJSON形式
        """
        try:
            obj = json.loads(ai_response)
        except json.JSONDecodeError:
            # コードブロック形式の場合の処理
            txt = ai_response.strip()
            if txt.startswith("```"):
                start = txt.find("{")
                end = txt.rfind("}")
                if start != -1 and end != -1 and end > start:
                    txt = txt[start : end + 1]
            obj = json.loads(txt)

        # 必須フィールドの検証
        for k in ("object_label", "ai_answer", "ai_question"):
            if k not in obj or not isinstance(obj[k], str):
                raise BadRequest(
                    "AIの出力が必要なJSON形式（object_label, ai_answer, ai_questionの各文字列）になっていません"
                )
        # grounding_urls は省略可。存在すれば list[str]、無ければ [] を設定
        grounding = obj.get("grounding_urls")
        if isinstance(grounding, list):
            urls: list[str] = []
            for u in grounding:
                if isinstance(u, str):
                    urls.append(u)
            obj["grounding_urls"] = urls
        else:
            obj["grounding_urls"] = []
        return obj

    @staticmethod
    def _gemini_request_by_base64(raw: bytes | Any, prompt: str) -> Dict[str, Union[str, list[str]]]:
        """
        Base64エンコードした画像でGemini APIを呼び出す（小さい画像用）

        Args:
            raw: 画像のバイトデータ
            prompt: プロンプト文字列

        Returns:
            解析結果の辞書（object_label, ai_answer, ai_question）
        """
        # 画像の縮小とJPEG化
        jpeg_bytes = AnalyzeService.downscale_to_jpeg(raw, max_long_edge=CONFIG.MAX_IMAGE_LONG_EDGE)

        # Gemini API呼び出し
        ai_response = gemini.generate_inline(jpeg_bytes, prompt)
        result = AnalyzeService._parse_answer_to_dict(ai_response)
        # GeminiClient が最後に抽出した grounding_urls をDictに付与
        try:
            urls = gemini.get_last_grounding_urls()
            print(urls)
            if isinstance(urls, list):
                result["grounding_urls"] = [u for u in urls if isinstance(u, str)]
        except Exception:
            # 取得できない場合は既定の [] を維持
            pass
        return result

    @staticmethod
    def _gemini_request_by_filesAPI(  # noqa: C901
        file: FileStorage, raw: bytes | Any, prompt: str
    ) -> Dict[str, Union[str, list[str]]]:
        """
        Files APIを使用してGemini APIを呼び出す（大きい画像用）

        Args:
            file: ファイルストレージオブジェクト（URL経由の場合は None）
            raw: 画像のバイトデータ
            prompt: プロンプト文字列

        Returns:
            解析結果の辞書
        """
        client = genai.Client()
        display_name = getattr(file, "filename", None) or "uploaded_image"
        # FileStorage が無い場合は sniff_mime で検出、フォールバックで image/jpeg
        detected_mime = AnalyzeService.sniff_mime(raw) if raw else None
        mime_type = (
            (getattr(file, "mimetype", None) if isinstance(file, FileStorage) else None)
            or detected_mime
            or "image/jpeg"
        )

        # 構造化出力（JSON強制）設定
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
            GENCFG_JSON = types.GenerateContentConfig(
                # response_mime_type="application/json",
                response_schema=JSON_SCHEMA,
                tools=[types.Tool(google_search=types.GoogleSearch())],
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

        grounding_urls: list[str] = []

        try:
            # candidates と groundingMetadata の取得
            candidates = getattr(response, "candidates", [])
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

        # レスポンステキストをDictに変換し、grounding_urlsをDictに付与して返す
        ai_response = getattr(response, "text", "") or str(response)
        result = AnalyzeService._parse_answer_to_dict(ai_response)
        result["grounding_urls"] = grounding_urls
        return result


def analyze(file: FileStorage | None, image_url: str | None, user_question: str | None) -> Dict[str, str]:
    return AnalyzeService.analyze(file, image_url, user_question)
