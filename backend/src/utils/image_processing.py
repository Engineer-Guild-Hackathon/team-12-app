import io

import magic
from PIL import Image


def sniff_mime(raw: bytes) -> str:
    mime = magic.from_buffer(raw, mime=True)
    return mime or "application/octet-stream"

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
