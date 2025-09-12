import datetime as dt
import uuid
from types import SimpleNamespace

import pytest

# テスト対象のモジュールを 'image_module' としてインポート
import src.services.image.image as image_module
from src.services.image.image import ImageService

# -------------------------------------------------------------
# ヘルパ: フェイク Session, Blob, Bucket
# -------------------------------------------------------------


class FakeSession:
    def __init__(self, *, get_returns=None, should_fail_on_commit=False):
        self.added = []
        self.committed = False
        self.refreshed = False
        self.deleted = []
        self.rolled_back = False
        self.closed = False
        self._get_returns = get_returns or {}
        self._should_fail_on_commit = should_fail_on_commit

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.closed = True

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        if self._should_fail_on_commit:
            raise RuntimeError("commit failed (fake)")
        self.committed = True

    def refresh(self, obj):
        now = dt.datetime.now(dt.timezone.utc)
        if getattr(obj, "created_at", None) is None:
            obj.created_at = now
        if getattr(obj, "updated_at", None) is None:
            obj.updated_at = now
        self.refreshed = True

    def rollback(self):
        self.rolled_back = True

    def get(self, model, key):
        return self._get_returns.get(key)

    def delete(self, obj):
        self.deleted.append(obj)


# GCSのBlob（ファイル）操作の偽物
class FakeBlob:
    def __init__(self, name):
        self.name = name
        self.deleted = False

    def upload_from_string(self, data, content_type):
        # 実際のアップロードは行わない
        pass

    def generate_signed_url(self, version, expiration, method):
        # 予測可能な固定のURLを返す
        return f"https://fake-signed-url.com/{self.name}?expires={expiration.total_seconds()}"

    def delete(self):
        # 削除されたことを記録
        self.deleted = True


# GCSのBucket（バケツ）操作の偽物
class FakeBucket:
    def blob(self, blob_name):
        return FakeBlob(blob_name)


# -------------------------------------------------------------
# モンキーパッチ: engine, adc_bucket, sa_bucket, SessionLocal
# -------------------------------------------------------------


@pytest.fixture
def sample_img_id() -> uuid.UUID:
    """テストで使う共通のUUIDを返す"""
    return uuid.uuid4()


@pytest.fixture
def sample_image_data() -> dict:
    """テストで使う共通の画像データを返す"""
    return {
        "file_data": b"fake-jpeg-bytes",
        "mime_type": "image/jpeg",
    }


@pytest.fixture
def patch_dependencies(monkeypatch):
    """
    image.py内の外部依存(DBとGCS)を偽物に差し替える。
    これにより、テストは外部に接続せず、メモリ内だけで完結する。
    """
    # DB/GCSがNone判定に引っかからないよう、ダミーオブジェクトをセット
    monkeypatch.setattr(image_module, "engine", object())
    monkeypatch.setattr(image_module, "adc_bucket", FakeBucket())
    monkeypatch.setattr(image_module, "sa_bucket", FakeBucket())

    # SessionLocal()が呼び出されたときに、我々のFakeSessionを返すように差し替える
    holder = SimpleNamespace(db_factory=None)

    def session_factory():
        assert holder.db_factory is not None, "FakeSession factory is not set"
        return holder.db_factory()

    monkeypatch.setattr(image_module, "SessionLocal", session_factory)

    # GCSのbucketも差し替え可能にしておく
    holder.adc_bucket = FakeBucket()
    holder.sa_bucket = FakeBucket()
    monkeypatch.setattr(image_module, "adc_bucket", holder.adc_bucket)
    monkeypatch.setattr(image_module, "sa_bucket", holder.sa_bucket)

    return holder


# -------------------------------------------------------------
# テストケース
# -------------------------------------------------------------


# --- save_image のテスト ---
def test_save_image_success(patch_dependencies, sample_image_data):
    """正常系: 画像の保存が成功するケース"""
    patch_dependencies.db_factory = lambda: FakeSession()
    result = ImageService.save_image(**sample_image_data)

    assert result is not None
    assert "img_id" in result
    assert result["status"] == "stored"
    assert result["gcs_uri"].startswith("gs://")


def test_save_image_db_failure_returns_none(patch_dependencies, sample_image_data):
    """異常系: DBへのコミットが失敗し、Noneが返るケース"""
    patch_dependencies.db_factory = lambda: FakeSession(should_fail_on_commit=True)
    result = ImageService.save_image(**sample_image_data)

    assert result is None


def test_save_image_gcs_failure_returns_none(patch_dependencies, sample_image_data, monkeypatch):
    """異常系: GCSへのアップロードが失敗し、Noneが返るケース"""

    def fake_upload(*args, **kwargs):
        raise ConnectionError("GCS upload failed (fake)")

    monkeypatch.setattr(FakeBlob, "upload_from_string", fake_upload)

    patch_dependencies.db_factory = lambda: FakeSession()
    result = ImageService.save_image(**sample_image_data)

    assert result is None


def test_save_image_raises_when_not_ready(monkeypatch, sample_image_data):
    """異常系: 依存関係(GCS)が初期化されていない場合にRuntimeErrorを送出するケース"""
    monkeypatch.setattr(image_module, "adc_bucket", None)
    with pytest.raises(RuntimeError):
        ImageService.save_image(**sample_image_data)


# --- get_image のテスト ---
def test_get_image_found(patch_dependencies, sample_img_id):
    """正常系: 指定したIDの画像が見つかるケース"""
    # DBから返される偽のImageオブジェクトを作成
    found_image = SimpleNamespace(
        img_id=sample_img_id,
        gcs_uri=f"gs://fake-bucket/images/{sample_img_id}.jpg",
        mime_type="image/jpeg",
        size_bytes=12345,
        status="stored",  # 重要な条件
        created_at=dt.datetime.now(dt.timezone.utc),
    )
    # FakeSessionがこのオブジェクトを返すように設定
    patch_dependencies.db_factory = lambda: FakeSession(get_returns={sample_img_id: found_image})

    result = ImageService.get_image(sample_img_id)

    assert result is not None
    assert result["img_id"] == str(sample_img_id)
    assert "signed_url" in result
    assert result["signed_url"].startswith("https://fake-signed-url.com/")


def test_get_image_not_found(patch_dependencies, sample_img_id):
    """異常系: 指定したIDの画像がDBに存在せず、Noneが返るケース"""
    patch_dependencies.db_factory = lambda: FakeSession(get_returns={})  # 空の辞書を返す
    result = ImageService.get_image(sample_img_id)

    assert result is None


def test_get_image_status_not_stored_returns_none(patch_dependencies, sample_img_id):
    """異常系: 画像は存在するが、ステータスが'stored'でないためNoneが返るケース"""
    pending_image = SimpleNamespace(img_id=sample_img_id, status="pending")
    patch_dependencies.db_factory = lambda: FakeSession(get_returns={sample_img_id: pending_image})
    result = ImageService.get_image(sample_img_id)

    assert result is None


# --- delete_image のテスト ---
def test_delete_image_success(patch_dependencies, sample_img_id):
    """正常系: 画像の削除が成功し、Trueが返るケース"""
    existing_image = SimpleNamespace(img_id=sample_img_id, gcs_uri=f"gs://fake-bucket/images/{sample_img_id}.jpg")
    patch_dependencies.db_factory = lambda: FakeSession(get_returns={sample_img_id: existing_image})

    ok = ImageService.delete_image(sample_img_id)

    assert ok is True


def test_delete_image_not_found_returns_false(patch_dependencies, sample_img_id):
    """異常系: 削除対象の画像が存在せず、Falseが返るケース"""
    patch_dependencies.db_factory = lambda: FakeSession(get_returns={})
    ok = ImageService.delete_image(sample_img_id)

    assert ok is False
