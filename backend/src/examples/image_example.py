from flask import Flask, request, render_template, jsonify, send_from_directory, url_for
import sys
import os
import base64
from pathlib import Path

# 設定
BASE_DIR = Path(__file__).resolve().parents[1]  # src/
sys.path.insert(0, str(BASE_DIR))
UPLOAD_DIR = BASE_DIR / "uploads"               # backend/src/uploads

from uploader.uploader import Uploader

app = Flask(__name__, template_folder=str(BASE_DIR / "examples" / "template"))
uploader = Uploader(upload_dir=str(UPLOAD_DIR), allowed_exts={"png","jpg","jpeg","gif","webp"}, max_bytes=10*1024*1024)

@app.route("/upload", methods=["GET"])
def upload_form():
    # uploader_test.html を表示（examples/template/uploader_test.html）
    return render_template("uploader_test.html")

@app.route("/upload", methods=["POST"])
def do_upload():
    # フォームの key が "image" の想定
    file = request.files.get("image")
    res = uploader.save(file)
    if not res.get("ok"):
        return jsonify(res), 400

    # すぐにプレビューしたいときのために data URL を作る（小さい画像向け）
    file_path = uploader.file_path(res["filename"])
    data_url = None
    try:
        with open(file_path, "rb") as f:
            raw = f.read()
            b64 = base64.b64encode(raw).decode("ascii")
            data_url = f"data:{res.get('mime_type','application/octet-stream')};base64,{b64}"
    except Exception:
        data_url = None

    # 画像にアクセスするための URL（ブラウザで表示可能）
    access_url = url_for("uploaded_file", filename=res["filename"], _external=False)

    return jsonify({
        "ok": True,
        "filename": res["filename"],
        "original_name": res["original_name"],
        "size": res["size"],
        "mime_type": res["mime_type"],
        "url": access_url,
        "data_url": data_url
    }), 201

@app.route("/uploads/<path:filename>", methods=["GET"])
def uploaded_file(filename):
    # uploads ディレクトリから直接配信（開発用）
    return send_from_directory(str(UPLOAD_DIR), filename, as_attachment=False)

@app.route("/")
def index():
    return "Uploader test app. GET /upload to try."

if __name__ == "__main__":
    # 実行方法: python src/examples/example_upload.py
    os.makedirs(str(UPLOAD_DIR), exist_ok=True)
    app.run(host="0.0.0.0", port=5000, debug=True)
