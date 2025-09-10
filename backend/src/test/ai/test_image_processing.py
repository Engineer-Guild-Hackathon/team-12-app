import io
# import importlib
import pytest
from PIL import Image

import utils.image_processing as mod


def _png_bytes(w=800, h=600) -> bytes:
    im = Image.new("RGB", (w, h), (50, 120, 200))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def test_sniff_mime_returns_image_prefix_if_available():
    if not hasattr(mod, "sniff_mime"):
        pytest.skip("sniff_mime が見つからないためスキップ")
    mime = mod.sniff_mime(_png_bytes())
    assert isinstance(mime, str)
    assert mime.startswith("image/")  # 実装差を吸収する緩めの検証


def test_downscale_to_jpeg_outputs_jpeg_bytes():
    if not hasattr(mod, "downscale_to_jpeg"):
        pytest.skip("downscale_to_jpeg が見つからないためスキップ")
    big = _png_bytes(4000, 2400)
    jpeg = mod.downscale_to_jpeg(big, max_long_edge=1600, quality=85)
    # JPEG マジック（FF D8）
    assert jpeg[:2] == b"\xff\xd8"
    # サイズは元より小さくなっているはず（厳密比較は避ける）
    assert len(jpeg) < len(big)
