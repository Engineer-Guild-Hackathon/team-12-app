import io
import pytest
from PIL import Image
from flask import Flask
from werkzeug.datastructures import FileStorage

from routes.img_analyze_route import img_analyze_bp
import services.ai.gemini_client as gemini_client


class _GeminiSpy:
    def generate_b64(self, image_jpeg_bytes: bytes, prompt: str) -> str:
        return "MOCK_OK"
    def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        return "MOCK_OK"


def _png_bytes() -> bytes:
    im = Image.new("RGB", (20, 20), (0, 255, 0))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(img_analyze_bp)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


def test_health_and_ready(client):
    r1 = client.get("/health");  assert r1.status_code == 200 and r1.json.get("ok") is True
    r2 = client.get("/ready");   assert r2.status_code == 200 and r2.json.get("ok") is True


def test_analyze_endpoint_with_file(monkeypatch: pytest.MonkeyPatch, client):
    # 実 API には飛ばさず常に "MOCK_OK"
    monkeypatch.setattr(gemini_client, "gemini", _GeminiSpy(), raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "10000000")

    data = {
        "file": (io.BytesIO(_png_bytes()), "x.png"),
        "question": "内容？",
    }
    r = client.post("/v1/analyze", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    assert r.json.get("answer") == "MOCK_OK"
