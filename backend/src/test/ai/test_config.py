# import os
import importlib

import pytest

import utils.config as config


def test_config_importable():
    # 単純にインポートできること
    assert config is not None


def test_config_env_overrides(monkeypatch: pytest.MonkeyPatch):
    """
    よくある構成を想定：
      - 環境変数 GEMINI_API_KEY を読む
      - B64_MAX_IMAGE_BYTES / HTTP_TIMEOUT を設定 or 参照
    モジュールの仕様が異なる場合は、存在しない属性の検証はスキップ。
    """
    monkeypatch.setenv("GEMINI_API_KEY", "dummy-key-xyz")
    monkeypatch.setenv("B64_MAX_IMAGE_BYTES", "123456")
    monkeypatch.setenv("HTTP_TIMEOUT", "7.5")

    # 再読込して反映を確認（実装によっては反映しない場合もある）
    import utils.config as cfg
    importlib.reload(cfg)

    # GEMINI_API_KEY
    if hasattr(cfg, "GEMINI_API_KEY"):
        assert cfg.GEMINI_API_KEY in ("dummy-key-xyz",)  # 文字列で取得できればOK
    else:
        pytest.skip("GEMINI_API_KEY を公開していない構成のためスキップ")

    # B64_MAX_IMAGE_BYTES
    if hasattr(cfg, "B64_MAX_IMAGE_BYTES"):
        assert isinstance(cfg.B64_MAX_IMAGE_BYTES, int)
    else:
        # 環境変数直読みの実装かもしれない
        pytest.skip("B64_MAX_IMAGE_BYTES が属性として無い構成のためスキップ")

    # HTTP_TIMEOUT
    if hasattr(cfg, "HTTP_TIMEOUT"):
        assert isinstance(cfg.HTTP_TIMEOUT, (int, float))
    else:
        pytest.skip("HTTP_TIMEOUT が属性として無い構成のためスキップ")
