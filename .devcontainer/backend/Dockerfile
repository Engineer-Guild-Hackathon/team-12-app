FROM python:3.12-slim
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

COPY .devcontainer/backend/pyproject.toml .devcontainer/backend/poetry.lock /backend/

RUN python -m pip install --upgrade pip && pip install poetry
RUN pip install gunicorn

RUN poetry config virtualenvs.create false
RUN if [ -f pyproject.toml ]; then poetry install --no-interaction --no-ansi --without dev,doc --no-root; fi

COPY backend/src /backend/src

WORKDIR /backend/src

EXPOSE 5000