import io

import pytest
import src.services.ai.analyze as analyze_mod
from flask import Flask
from PIL import Image
from src.routes.img_analyze_route import img_analyze_bp
from werkzeug.datastructures import FileStorage


class _GeminiSpy:
    def generate_inline(self, image_jpeg_bytes: bytes, prompt: str) -> str:
        return '{"object_label":"T","ai_answer":"A","ai_question":"Q"}'

    def generate_file_storage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        return '{"object_label":"T","ai_answer":"A","ai_question":"Q"}'


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


def test_analyze_endpoint_with_file(monkeypatch: pytest.MonkeyPatch, client):
    # 実 API には飛ばさず常に "MOCK_OK"
    # analyze.py 内の gemini を直接パッチ
    monkeypatch.setattr(analyze_mod, "gemini", _GeminiSpy(), raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    monkeypatch.setenv("INLINE_MAX_IMAGE_BYTES", "10000000")

    data = {
        "file": (io.BytesIO(_png_bytes()), "x.png"),
        "user_question": "内容？",
    }
    r = client.post("/v1/analyze", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    # ルートが {"ai_response": {...}} で包んで返す実装に合わせる
    body = r.json
    assert isinstance(body, dict) and "ai_response" in body
    ans = body["ai_response"]
    assert ans.get("object_label") == "T"
    assert ans.get("ai_answer") == "A"
    assert ans.get("ai_question") == "Q"
