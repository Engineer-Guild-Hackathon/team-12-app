# Python ランタイム（必要に応じて pinned）
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LANG=ja_JP.UTF-8

WORKDIR /backend

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        g++ \
        python3-dev \
        pkg-config \
        # ★ python-magic が必要とする OS 依存ライブラリ
        libmagic1 \
        libmagic-dev && \
        # （必要に応じて file コマンドも）
        # file && \
    rm -rf /var/lib/apt/lists/*

# 依存物（あなたのプロジェクト構成に合わせて）
COPY backend/pyproject.toml backend/poetry.lock ./
RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --without dev --no-root

# アプリ本体
COPY backend/src/services/image /backend/src/services/image
COPY backend/src/services/post /backend/src/services/post
COPY backend/src/services/vertex_ai /backend/src/services/vertex_ai
COPY backend/src/utils/db/ /backend/src/utils/db/

# エントリポイント：バッチを 1 回実行して正常終了
ENTRYPOINT ["python", "-u", "src/services/vertex_ai/create_vertex_metadata.py"]
