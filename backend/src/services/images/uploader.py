import os
from uuid import uuid4
from werkzeug.utils import secure_filename

class Uploader:
    """
    ファイル保存（画像）を担当するクラス。
    - save(file_storage): FileStorage を受け取り、UPLOAD_DIR に保存して保存名を返す
    - make_filename(original_name): 保存用に UUID ベースの安全な basename を生成
    - file_path(filename): 保存先の絶対パスを返す
    """

    def __init__(self, upload_dir: str = "uploads", allowed_exts=None, max_bytes: int = 20 * 1024 * 1024):
        self.upload_dir = os.path.abspath(upload_dir)
        os.makedirs(self.upload_dir, exist_ok=True)
        self.allowed_exts = set(x.lower() for x in (allowed_exts or {"png", "jpg", "jpeg", "gif", "webp"}))
        self.max_bytes = max_bytes

    def _ext_allowed(self, filename: str) -> bool:
        if not filename or "." not in filename:
            return False
        ext = filename.rsplit(".", 1)[1].lower()
        return ext in self.allowed_exts

    def make_filename(self, original_name: str) -> str:
        """
        original_name から安全な保存名（UUID + 拡張子）を作る。
        例: 'f3b2a1c4e5d6f7a8b9c0d1e2f3a4b5c6.jpg'
        """
        ext = ""
        if original_name and "." in original_name:
            ext = "." + original_name.rsplit(".", 1)[1].lower()
        return f"{uuid4().hex}{ext}"

    def file_path(self, filename: str) -> str:
        """
        保存名から絶対パスを返す（path traversal 対策として upload_dir 配下であることを確認）。
        """
        candidate = os.path.abspath(os.path.join(self.upload_dir, secure_filename(filename)))
        if not candidate.startswith(self.upload_dir + os.sep) and candidate != self.upload_dir:
            raise ValueError("Invalid filename/path")
        return candidate
    
    def save(self, file_storage):
        """
        FileStorage を受け取り保存する。
        戻り値（dict）:
          {
            "ok": True/False,
            "reason": "..." (エラー時),
            "filename": "<保存名>",
            "original_name": "<元のファイル名>",
            "size": int,   # bytes
            "mime_type": "image/jpeg"
          }
        """
        if file_storage is None:
            return {"ok": False, "reason": "no file provided"}

        original_name = getattr(file_storage, "filename", "") or ""
        if original_name == "":
            return {"ok": False, "reason": "empty filename"}

        # 拡張子チェック
        if not self._ext_allowed(original_name):
            return {"ok": False, "reason": "file extension not allowed"}

        # サイズチェック（werkzeug の limit とは別にここでチェック）
        file_storage.stream.seek(0, os.SEEK_END)
        size = file_storage.stream.tell()
        file_storage.stream.seek(0)

        if size > self.max_bytes:
            return {"ok": False, "reason": f"file too large ({size} bytes)"}

        save_name = self.make_filename(original_name)
        path = self.file_path(save_name)

        try:
            # werkzeug FileStorage.save を使うとストリームを直接書き出せる
            file_storage.save(path)
            actual_size = os.path.getsize(path)
            return {
                "ok": True,
                "filename": save_name,
                "original_name": original_name,
                "size": actual_size,
                "mime_type": getattr(file_storage, "mimetype", None)
            }
        except Exception as e:
            return {"ok": False, "reason": f"failed to save: {e}"}