import io

import pytest
import src.services.ai.gemini_client as gemini_client
from PIL import Image
from werkzeug.datastructures import FileStorage


def _png_bytes() -> bytes:
    im = Image.new("RGB", (32, 32), (200, 100, 20))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def test_gemini_client_surface_is_present():
    """
    このテストは「外部 API を叩かない」前提の**表層テスト**です。
    - gemini_client モジュールが import できること
    - どちらかの API 表面があること（'gemini' インスタンス or 'GeminiClient' クラス）
    """
    assert gemini_client is not None
    assert hasattr(gemini_client, "gemini") or hasattr(gemini_client, "GeminiClient")


def test_gemini_client_is_mockable(monkeypatch: pytest.MonkeyPatch):
    """
    analyze 側で行うモック方針が機能するかの確認：
        - gemini_client.gemini を差し替え可能であること
        - generate_inline / generate_fileStorage の形で呼び出せること
    """

    class _Spy:
        def __init__(self):
            self.inline = False
            self.files = False

        def generate_inline(self, image_jpeg_bytes: bytes, prompt: str) -> str:
            self.inline = True
            return "OK_VIA_BYTES"

        def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
            self.files = True
            return "OK_FILES"

    spy = _Spy()
    monkeypatch.setattr(gemini_client, "gemini", spy, raising=False)

    # inline
    b = _png_bytes()
    out1 = gemini_client.gemini.generate_inline(b, "q")
    assert out1 == "OK_VIA_BYTES" and spy.inline is True

    # files
    fs = FileStorage(stream=io.BytesIO(b), filename="x.png", content_type="image/png")
    out2 = gemini_client.gemini.generate_fileStorage(fs, "q")
    assert out2 == "OK_FILES" and spy.files is True
