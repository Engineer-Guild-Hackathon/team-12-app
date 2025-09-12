FROM python:3.12-slim
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && \
    apt-get -y install locales && \
    localedef -f UTF-8 -i ja_JP ja_JP.UTF-8
ENV LANG=ja_JP.UTF-8 \
    LANGUAGE=ja_JP:ja \
    LC_CTYPE=ja_JP.UTF-8 \
    TZ=Asia/Tokyo \
    TERM=xterm

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

COPY backend/pyproject.toml backend/poetry.lock ./

RUN python -m pip install --upgrade pip && pip install poetry
RUN pip install gunicorn

ARG POETRY_WITH=""
ARG POETRY_WITHOUT="doc"

RUN poetry config virtualenvs.create false
RUN poetry install --no-interaction --no-ansi \
    $( [ -n "$POETRY_WITH" ] && echo --with "$POETRY_WITH" ) \
    $( [ -n "$POETRY_WITHOUT" ] && echo --without "$POETRY_WITHOUT" ) \
    --no-root

COPY backend/ ./

EXPOSE 5000
