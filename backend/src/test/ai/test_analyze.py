import io

import pytest
import src.services.ai.analyze as analyze_mod
from PIL import Image
from werkzeug.datastructures import FileStorage


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
    # Base64 経路を確実に
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "10000000")

    # gemini をスパイに差し替え
    spy = _GeminiSpy()
    # analyze.py 内の束縛済み参照を直接差し替える
    monkeypatch.setattr(analyze_mod, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_small_png_bytes()), filename="tiny.png", content_type="image/png")
    result = analyze_mod.analyze(file=fs, image_url=None, question="何が写っていますか？")
    assert isinstance(result, dict)
    assert result.get("title") == "T"
    assert result.get("discovery") == "D"
    assert result.get("question") == "Q"
    assert spy.called_b64 is True
    assert spy.called_files is False


def test_analyze_calls_gemini_via_files_when_threshold_low(monkeypatch: pytest.MonkeyPatch):
    # ←← ここから追加：google-genai の Files.upload をテスト用ダミーに置き換え

    import types as _types

    _calls = {"upload": False, "generate": False}  # ← 呼び出し記録

    class _DummyFiles:
        # display_name/mime_type など、どんな引数が来ても受ける
        def upload(self, *args, **kwargs):
            _calls["upload"] = True
            # analyze 側が参照しうる最小限の属性を返す
            return _types.SimpleNamespace(name="files/TEST_ID", uri="gs://dummy")

    class _DummyModels:
        def generate_content(self, *args, **kwargs):
            _calls["generate"] = True
            # analyze 側が response.text を読む前提で JSON を返す
            json_str = '{"title":"T","discovery":"D","question":"Q"}'
            return _types.SimpleNamespace(
                text=json_str,
                # もし実装が candidates 経由で読む場合にも備えておく
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

    # analyze.py 内で参照する genai.Client を差し替え
    monkeypatch.setattr(analyze_mod, "genai", _types.SimpleNamespace(Client=_DummyClient), raising=False)
    # ここまで追加 → 本物SDKのシグネチャ差異に影響されず Files 経路を通せる
    # --- Files 経路を確実に踏ませるための前準備（安全版） ---
    # 1) frozen dataclass を直接いじらず、新インスタンスで CONFIG を置き換える
    from dataclasses import replace

    if hasattr(analyze_mod, "CONFIG"):
        new_cfg = replace(analyze_mod.CONFIG, B64_MAX_IMAGE_BYTES=1)  # 閾値を極小に
        monkeypatch.setattr(analyze_mod, "CONFIG", new_cfg, raising=False)
    # 2) JPEG化後のサイズを巨大にして、閾値を必ず超えさせる
    monkeypatch.setattr(
        analyze_mod,
        "downscale_to_jpeg",
        lambda _raw, _max_long_edge, _quality: b"x" * 2_000_000,
        raising=False,
    )
    # これで分岐（jpeg_bytes > CONFIG.B64_MAX_IMAGE_BYTES）が必ず True → Files 経路へ
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key")
    # Files API 経路を確実に踏ませるため閾値を極端に小さく
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "1000")

    spy = _GeminiSpy()
    monkeypatch.setattr(analyze_mod, "gemini", spy, raising=False)

    fs = FileStorage(stream=io.BytesIO(_large_jpeg_bytes()), filename="big.jpg", content_type="image/jpeg")
    result = analyze_mod.analyze(file=fs, image_url=None, question="何が写っていますか？")
    assert isinstance(result, dict)
    assert result.get("title") == "T"
    assert result.get("discovery") == "D"
    assert result.get("question") == "Q"
    # Files 経路の証拠：upload と generate_content が呼ばれている
    assert _calls["upload"] is True
    assert _calls["generate"] is True
    # B64 経路は通っていない
    assert spy.called_b64 is False
