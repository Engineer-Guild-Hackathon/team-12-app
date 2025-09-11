import os
import sys
from pathlib import Path

from flask import Flask, render_template, request

# --- パス設定 ---
try:
    BASE_DIR = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(BASE_DIR))
    print(f"Added to Python path: {BASE_DIR}")
except IndexError:
    print("ERROR: Could not determine base directory.")
    sys.exit(1)

# --- services のインポート ---
try:
    from services.images.image import SaveImage
except ImportError as e:
    print(f"ERROR: Failed to import SaveImage class: {e}")
    sys.exit(1)

app = Flask(__name__, template_folder=str(BASE_DIR / "examples" / "template"))

@app.route('/')
def index():
    return render_template('example_image.html')

@app.route('/images', methods=['POST'])
def save_file():
    message = None
    category = None

    if 'image_file' not in request.files or request.files['image_file'].filename == '':
        message = 'ファイルが選択されていません。'
        category = 'error'
        return render_template('example_image.html', message=message, category=category)

    file = request.files['image_file']

    try:
        saver = SaveImage(file)
        result, status_code = saver.execute()

        if status_code < 400:
            category = 'success'
            message = f"アップロード成功！\n\nレスポンス:\n{result}"
        else:
            category = 'error'
            message = f"アップロード失敗！\n\nレスポンス:\n{result}"

    except Exception as e:
        category = 'error'
        message = f"予期せぬエラーが発生しました:\n{e}"

    return render_template('example_image.html', message=message, category=category)

if __name__ == '__main__':
    required_vars = ["GCP_PROJECT", "CLOUDSQL_REGION", "CLOUDSQL_INSTANCE", "DB_NAME", "DB_USER", "GCS_BUCKET"]
    if not all(os.environ.get(v) for v in required_vars):
        missing = [v for v in required_vars if not os.environ.get(v)]
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    app.run(debug=True, host="0.0.0.0", port=5000)
