import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class _Config:
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    GCP_PROJECT_ID: str | None = os.getenv("PROJECT_ID")

    # 入力制限
    # Geminiは20MBまでbase64許容だが念のため15MB
    INLINE_MAX_IMAGE_BYTES: int = int(os.getenv("INLINE_MAX_IMAGE_BYTES", "15000000"))
    MAX_IMAGE_LONG_EDGE: int = int(os.getenv("MAX_IMAGE_LONG_EDGE", "1600"))

    # HTTP
    HTTP_TIMEOUT: float = float(os.getenv("HTTP_TIMEOUT", "20.0"))

    # CORS等（必要なら app.py 側で使用）
    ALLOWED_ORIGINS: tuple[str] = tuple(
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    )


CONFIG = _Config()
