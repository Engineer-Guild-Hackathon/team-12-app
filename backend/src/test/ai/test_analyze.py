import io

import pytest
import src.services.ai.analyze as analyze_mod
from PIL import Image
from werkzeug.datastructures import FileStorage
from werkzeug.exceptions import BadRequest


class _GeminiSpy:
    def __init__(self):
        self.called_b64 = False
        self.called_files = False

    def generate_b64(self, image_jpeg_bytes: bytes, prompt: str) -> str:
        self.called_b64 = True
        return '{"title":"T","discovery":"D","question":"Q"}'

    def generate_fileStorage(self, image_jpeg_file: FileStorage, prompt: str) -> str:
        self.called_files = True
        return '{"title":"T","discovery":"D","question":"Q"}'


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

    # Base64 経路を確実に踏ませるため閾値を十分大きく
    from dataclasses import replace
    monkeypatch.setattr(analyze_mod, "CONFIG", replace(analyze_mod.CONFIG, B64_MAX_IMAGE_BYTES=10_000_000), raising=False)

    # gemini をスパイに差し替え
    spy = _GeminiSpy()
    monkeypatch.setattr(analyze_mod, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_small_png_bytes()), filename="tiny.png", content_type="image/png")
    result = analyze_mod.analyze(file=fs, image_url=None, question="何が写っていますか？")
    assert isinstance(result, dict)
    assert result.get("title") == "T"
    assert result.get("discovery") == "D"
    assert result.get("question") == "Q"
    assert spy.called_b64 is True
    # Files 経路は（このテストでは使っていないが）FalseのままでOK
    assert spy.called_files is False


def test_analyze_calls_gemini_via_files_when_threshold_low(monkeypatch: pytest.MonkeyPatch):
    # google-genai の Files.upload / models.generate_content をテスト用ダミーに置換
    import types as _types

    _calls = {"upload": False, "generate": False}

    class _DummyFiles:
        def upload(self, *args, **kwargs):
            _calls["upload"] = True
            return _types.SimpleNamespace(name="files/TEST_ID", uri="gs://dummy")

    class _DummyModels:
        def generate_content(self, *args, **kwargs):
            _calls["generate"] = True
            json_str = '{"title":"T","discovery":"D","question":"Q"}'
            return _types.SimpleNamespace(
                text=json_str,
                candidates=[
                    _types.SimpleNamespace(
                        content=_types.SimpleNamespace(parts=[_types.SimpleNamespace(text=json_str)])
                    )
                ],
            )

    class _DummyClient:
        def __init__(self):
            self.files = _DummyFiles()
            self.models = _DummyModels()

    monkeypatch.setattr(analyze_mod, "genai", _types.SimpleNamespace(Client=_DummyClient), raising=False)

    # Files 経路を確実に踏ませるため：
    # 1) B64 閾値を極小に
    from dataclasses import replace
    monkeypatch.setattr(analyze_mod, "CONFIG", replace(analyze_mod.CONFIG, B64_MAX_IMAGE_BYTES=1), raising=False)
    # 2) JPEG化後のサイズを巨大に（現在の実装は downscale_to_jpeg(raw, max_long_edge)）
    monkeypatch.setattr(
        analyze_mod,
        "downscale_to_jpeg",
        lambda _raw, _max_long_edge: b"x" * 2_000_000,
        raising=False,
    )

    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")

    # gemini スパイ（B64 経路が呼ばれないことの確認用）
    spy = _GeminiSpy()
    monkeypatch.setattr(analyze_mod, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_large_jpeg_bytes()), filename="big.jpg", content_type="image/jpeg")
    result = analyze_mod.analyze(file=fs, image_url=None, question="何が写っていますか？")
    assert isinstance(result, dict)
    assert result.get("title") == "T"
    assert result.get("discovery") == "D"
    assert result.get("question") == "Q"
    assert _calls["upload"] is True
    assert _calls["generate"] is True
    assert spy.called_b64 is False  # B64 経路は通っていない


# ---- 置き換え：_fetch_image_bytes は gs:// のみ受付 ----


def test_fetch_image_bytes_only_accepts_gs_and_calls_gcs(monkeypatch: pytest.MonkeyPatch):
    # 非 gs は BadRequest
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_image_bytes("http://x.invalid/img.png")
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_image_bytes("https://example.com/a.jpg")

    # gs は _fetch_gcs_bytes に委譲される（呼ばれることを確認）
    called = {"ok": False}

    def _dummy_fetch_gcs_bytes(gs_url: str) -> bytes:
        called["ok"] = True
        assert gs_url == "gs://bkt/path/to.jpg"
        return b"IMG"

    monkeypatch.setattr(
        analyze_mod.AnalyzeService, "_fetch_gcs_bytes", staticmethod(_dummy_fetch_gcs_bytes), raising=False
    )
    got = analyze_mod.AnalyzeService._fetch_image_bytes("gs://bkt/path/to.jpg")
    assert called["ok"] is True
    assert got == b"IMG"


def test_rejects_non_image_bytes(monkeypatch: pytest.MonkeyPatch):
    """画像でないバイト列は BadRequest"""
    fs = FileStorage(stream=io.BytesIO(b"not-an-image"), filename="note.txt", content_type="text/plain")
    with pytest.raises(BadRequest):
        analyze_mod.analyze(file=fs, image_url=None, question=None)


def test_parse_allows_code_fence_json():
    """```json ... ``` のようなコードフェンス付きでもパースできる"""
    fenced = """```json
    {
        "title": "T",
        "discovery": "D",
        "question": "Q"
    }
    ```"""
    got = analyze_mod.AnalyzeService._parse_answer_to_dict(fenced)
    assert got == {"title": "T", "discovery": "D", "question": "Q"}


def test_fetch_gcs_bytes_success(monkeypatch: pytest.MonkeyPatch):
    """gs:// 読み出し成功パス"""
    import types as _types

    class _DummyBlob:
        def __init__(self, name):
            self._name = name

        def download_as_bytes(self):
            return b"IMG"

    class _DummyBucket:
        def __init__(self, name):
            self._name = name

        def blob(self, blob_name):
            return _DummyBlob(blob_name)

    class _DummyClient:
        def __init__(self, project=None):
            self._project = project

        def bucket(self, name):
            return _DummyBucket(name)

    monkeypatch.setattr(analyze_mod, "storage", _types.SimpleNamespace(Client=_DummyClient), raising=False)
    data = analyze_mod.AnalyzeService._fetch_gcs_bytes("gs://my-bkt/path/to%20file.jpg")
    assert data == b"IMG"


def test_fetch_gcs_bytes_errors(monkeypatch: pytest.MonkeyPatch):
    """gs:// のフォーマット・ディレクトリ指定・ダウンロード失敗を検証"""
    import types as _types

    # 形式不正
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_gcs_bytes("http://not-gs/path")
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_gcs_bytes("gs://bucket-only-no-object")
    # フォルダ末尾
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_gcs_bytes("gs://bkt/folder/")

    # ダウンロード失敗
    class _DummyBlob:
        def download_as_bytes(self):
            raise RuntimeError("boom")

    class _DummyBucket:
        def blob(self, name):
            return _DummyBlob()

    class _DummyClient:
        def __init__(self, project=None):
            pass

        def bucket(self, name):
            return _DummyBucket()

    monkeypatch.setattr(analyze_mod, "storage", _types.SimpleNamespace(Client=_DummyClient), raising=False)
    with pytest.raises(BadRequest):
        analyze_mod.AnalyzeService._fetch_gcs_bytes("gs://bkt/file.jpg")
