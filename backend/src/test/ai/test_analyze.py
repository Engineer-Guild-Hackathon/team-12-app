import io
from PIL import Image
import pytest
from werkzeug.datastructures import FileStorage

from services.ai.analyze import analyze
import services.ai.gemini_client as gemini_client


class _GeminiSpy:
    def __init__(self):
        self.called_b64 = False
        self.called_files = False

    def generate_b64(self, image_jpeg_bytes: bytes, prompt: str) -> str:
        self.called_b64 = True
        return "MOCK_B64_RESPONSE"

    def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        self.called_files = True
        return "MOCK_FILES_RESPONSE"


def _small_png_bytes() -> bytes:
    im = Image.new("RGB", (64, 40), (0, 200, 80))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def _large_jpeg_bytes() -> bytes:
    im = Image.new("RGB", (4000, 3000), (200, 30, 30))
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def test_analyze_calls_gemini_via_b64(monkeypatch: pytest.MonkeyPatch):
    # 実 API キーが無くても落ちないようダミー
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    # Base64 経路を確実に
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "10000000")

    # gemini をスパイに差し替え
    spy = _GeminiSpy()
    monkeypatch.setattr(gemini_client, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_small_png_bytes()), filename="tiny.png", content_type="image/png")
    result = analyze(file=fs, image_url=None, question="何が写っていますか？")

    assert result == "MOCK_B64_RESPONSE"
    assert spy.called_b64 is True
    assert spy.called_files is False


def test_analyze_calls_gemini_via_files_when_threshold_low(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    # Files API 経路を確実に踏ませるため閾値を極端に小さく
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "1000")

    spy = _GeminiSpy()
    monkeypatch.setattr(gemini_client, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_large_jpeg_bytes()), filename="big.jpg", content_type="image/jpeg")
    result = analyze(file=fs, image_url=None, question="何が写っていますか？")

    assert result == "MOCK_FILES_RESPONSE"
    assert spy.called_files is True
    assert spy.called_b64 is False
