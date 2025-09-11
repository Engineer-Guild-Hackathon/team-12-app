import io
import sys
import types

import pytest
from flask import Flask
from PIL import Image
from werkzeug.datastructures import FileStorage

import services.ai.analyze as analyze_mod  # ← 追加
from routes.img_analyze_route import img_analyze_bp

# --- magic をテスト時だけダミー化 ---
magic = types.ModuleType("magic")


def _from_buffer(b, mime=True):
    return "image/png"  # 画像として扱わせる


magic.from_buffer = _from_buffer
sys.modules["magic"] = magic
# -----------------------------------


class _GeminiSpy:
    def generate_b64(self, image_jpeg_bytes: bytes, prompt: str) -> str:
        return '{"title":"T","discovery":"D","question":"Q"}'

    def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        return '{"title":"T","discovery":"D","question":"Q"}'


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
    r1 = client.get("/health")
    assert r1.status_code == 200 and r1.json.get("ok") is True
    r2 = client.get("/ready")
    assert r2.status_code == 200 and r2.json.get("ready") is True


def test_analyze_endpoint_with_file(monkeypatch: pytest.MonkeyPatch, client):
    # 実 API には飛ばさず常に "MOCK_OK"
    # analyze.py 内の gemini を直接パッチ
    monkeypatch.setattr(analyze_mod, "gemini", _GeminiSpy(), raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "10000000")

    data = {
        "file": (io.BytesIO(_png_bytes()), "x.png"),
        "question": "内容？",
    }
    r = client.post("/v1/analyze", data=data, content_type="multipart/form-data")
    assert r.status_code == 200
    # ルートが {"answer": {...}} で包んで返す実装に合わせる
    body = r.json
    assert isinstance(body, dict) and "answer" in body
    ans = body["answer"]
    assert ans.get("title") == "T"
    assert ans.get("discovery") == "D"
    assert ans.get("question") == "Q"
