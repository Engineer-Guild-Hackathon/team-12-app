"""
example_img_analyze.py

このスクリプトは、画像ファイルをAI画像解析API（Flaskサーバの /v1/analyze エンドポイント）に送り、
AIからのレスポンス（物体名・説明・質問）を受け取る一連の流れを示します。

【前提】
- サーバ側（img_analyze_route.py, analyze.py, gemini_client.py, config.py, image_processing.py）が起動済み
- 必要なAPIキー等が設定済み
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict

from flask import Flask, jsonify, render_template_string, request

# 既存ルート（/health, /ready, /v1/analyze）を流用
from src.routes.img_analyze_route import img_analyze_bp

# 直接関数を呼び出す（フォームPOSTで即AIを叩く用途）
from src.services.ai.analyze import AnalyzeService
from src.utils.config import CONFIG
from werkzeug.exceptions import BadRequest

app = Flask(__name__, template_folder="template")
app.secret_key = "dev"  # 本番では安全な値に
app.logger.setLevel(logging.INFO)

# Blueprint 登録（APIとして /health /ready /v1/analyze を有効化）
app.register_blueprint(img_analyze_bp, url_prefix="")


# 簡易フォーム（example_post.py に倣い、サーバ側で初期値を用意）
def _default_form_values() -> Dict[str, Any]:
    return {
        "user_id": str(uuid.uuid4()),
        "img_id": str(uuid.uuid4()),
        "question": "この画像に写っている物体について説明してください。",
        "image_url": "",
    }


INDEX_HTML = """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>example_img_analyze</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:960px;margin:40px auto;padding:0 16px;line-height:1.6}
      header{display:flex;align-items:baseline;gap:8px}
      code,pre{background:#f6f8fa;padding:.2em .4em;border-radius:6px}
      .row{margin:.5rem 0}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .result{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa}
      .muted{color:#6b7280}
      footer{margin-top:32px;color:#6b7280}
    </style>
  </head>
  <body>
    <header>
      <h1>example_img_analyze.py</h1>
      <span class="muted">— Gemini 画像解析の最小実装</span>
    </header>

    <p class="muted">GEMINI_MODEL={{ model }} / ready={{ ready }}</p>

    <form action="{{ url_for('analyze_form') }}" method="post" enctype="multipart/form-data">
      <div class="row">
        <label>画像ファイル: <input type="file" name="file" accept="image/*"></label>
      </div>
      <div class="row">
        <label>画像URL: <input type="url" name="image_url" value="{{ form.image_url }}" placeholder="https://..."></label>
      </div>
      <div class="row">
        <label>質問: <input type="text" name="question" value="{{ form.question }}" size="60"></label>
      </div>
      <div class="row">
        <button type="submit">解析する</button>
      </div>
    </form>

    {% if result %}
    <h2>結果</h2>
    <div class="grid">
      <div class="result">
        <h3>title</h3>
        <div>{{ result.title | e }}</div>
      </div>
      <div class="result">
        <h3>discovery</h3>
        <div style="white-space:pre-wrap">{{ result.discovery | e }}</div>
      </div>
    </div>
    <div class="result" style="margin-top:12px">
      <h3>question</h3>
      <div>{{ result.question | e }}</div>
    </div>
    {% endif %}

    {% if error %}
    <h2>エラー</h2>
    <pre>{{ error }}</pre>
    {% endif %}

    <footer>
      <p>API: <code>POST /v1/analyze</code>（このアプリ内で有効） / <code>GET /health</code> / <code>GET /ready</code></p>
    </footer>
  </body>
</html>
"""


@app.get("/")
def index():
    # readiness を表示（CONFIG.GEMINI_API_KEY の有無）
    ready = bool(CONFIG.GEMINI_API_KEY)
    return render_template_string(
        INDEX_HTML,
        model=CONFIG.GEMINI_MODEL,
        ready=ready,
        form=_default_form_values(),
        result=None,
        error=None,
    )


@app.post("/analyze")
def analyze_form():
    """
    フォーム POST → 直接 AnalyzeService.analyze(...) を呼ぶ。
    画像は file / image_url のどちらか必須。
    """
    file = request.files.get("file")
    image_url = request.form.get("image_url") or None
    question = request.form.get("question") or None

    if not file and not image_url:
        raise BadRequest("file or image_url is required")

    try:
        parsed = AnalyzeService.analyze(file=file, image_url=image_url, question=question)
        # parsed は {"title": str, "discovery": str, "question": str}
        return render_template_string(
            INDEX_HTML,
            model=CONFIG.GEMINI_MODEL,
            ready=True,
            form=_default_form_values(),
            result=parsed,
            error=None,
        )
    except BadRequest as e:
        return render_template_string(
            INDEX_HTML,
            model=CONFIG.GEMINI_MODEL,
            ready=True,
            form=_default_form_values(),
            result=None,
            error=str(e),
        ), 400
    except TimeoutError as e:
        return render_template_string(
            INDEX_HTML,
            model=CONFIG.GEMINI_MODEL,
            ready=True,
            form=_default_form_values(),
            result=None,
            error=str(e),
        ), 504
    except Exception as e:
        return render_template_string(
            INDEX_HTML,
            model=CONFIG.GEMINI_MODEL,
            ready=True,
            form=_default_form_values(),
            result=None,
            error=f"upstream error: {e}",
        ), 502


# API として JSON を返して欲しい場合のエンドポイント（CLI 連携など）
@app.post("/v1/local-analyze")
def local_analyze():
    file = request.files.get("file")
    image_url = request.form.get("image_url") or None
    question = request.form.get("question") or None
    if not file and not image_url:
        raise BadRequest("file or image_url is required")
    parsed = AnalyzeService.analyze(file=file, image_url=image_url, question=question)
    return jsonify(parsed), 200


if __name__ == "__main__":
    # ポートは example_post.py と被らないように 5002
    app.run(host="0.0.0.0", port=5002, debug=True, threaded=True)
