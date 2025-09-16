import datetime as dt
import uuid
from types import SimpleNamespace

import pytest

# ここが重要：ファイルモジュールを直接 import
import src.services.post.post as post_module
from src.services.post.post import PostService


# ----------------------------
# ヘルパ: フェイク Session/Query
# ----------------------------
class FakeQuery:
    def __init__(self, rows):
        self._rows = rows

    def order_by(self, *_args, **_kwargs):
        return self

    def filter(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def offset(self, *_args, **_kwargs):
        return self

    def all(self):
        return self._rows


class FakeSession:
    def __init__(self, *, get_returns=None, query_rows=None, should_fail_on_commit=False):
        self.added = []
        self.committed = False
        self.refreshed = False
        self.deleted = []
        self.rolled_back = False
        self.closed = False

        self._get_returns = get_returns  # dict[uuid.UUID -> obj or None]
        self._query_rows = query_rows or []
        self._should_fail_on_commit = should_fail_on_commit

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.closed = True
        return False

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        if self._should_fail_on_commit:
            raise RuntimeError("commit failed (fake)")
        self.committed = True

    def refresh(self, obj):
        now = dt.datetime.now(dt.timezone.utc)
        if getattr(obj, "date", None) is None:
            obj.date = now
        if getattr(obj, "updated_at", None) is None:
            obj.updated_at = now
        self.refreshed = True

    def rollback(self):
        self.rolled_back = True

    def get(self, model, key):
        if self._get_returns is None:
            return None
        return self._get_returns.get(key)

    def query(self, model):
        return FakeQuery(self._query_rows)

    def delete(self, obj):
        self.deleted.append(obj)


# ----------------------------
# 共通フィクスチャ: UUID/ペイロード
# ----------------------------
@pytest.fixture
def sample_ids():
    return {
        "post_id": uuid.uuid4(),
        "user_id": "string_type_user_id",
        "img_id": uuid.uuid4(),
    }


@pytest.fixture
def sample_payload(sample_ids):
    return dict(
        post_id=sample_ids["post_id"],
        user_id=sample_ids["user_id"],
        img_id=sample_ids["img_id"],
        user_question="Q",
        object_label="TGT",
        ai_answer="ANS",
        ai_question="TOI",
        location="札幌市 中央区",
        latitude=43.068,
        longitude=141.35,
    )


# ----------------------------
# モンキーパッチ: SessionLocal / engine
# ----------------------------
@pytest.fixture
def patch_session_engine(monkeypatch):
    """
    テスト毎に FakeSession を差し込める。
    呼び出し側は holder.factory に FakeSession を返す関数を入れる。
    """
    # engine が None 判定にひっかからないようダミーをセット
    monkeypatch.setattr(post_module, "engine", object(), raising=False)

    holder = SimpleNamespace(factory=None)

    def session_factory():
        assert holder.factory is not None, "FakeSession factory is not set"
        return holder.factory()

    # SessionLocal() が with コンテキストを返すよう、callable を差し込む
    monkeypatch.setattr(post_module, "SessionLocal", session_factory, raising=False)
    return holder


# ----------------------------
# create_post
# ----------------------------
def test_create_post_success(patch_session_engine, sample_payload):
    patch_session_engine.factory = lambda: FakeSession()
    result = PostService.create_post(**sample_payload)
    assert result is not None
    assert result["post_id"] == str(sample_payload["post_id"])
    assert result["user_question"] == "Q"
    assert result["latitude"] == sample_payload["latitude"]
    assert "date" in result and result["date"] is not None


def test_create_post_commit_failure_returns_none(patch_session_engine, sample_payload):
    patch_session_engine.factory = lambda: FakeSession(should_fail_on_commit=True)
    result = PostService.create_post(**sample_payload)
    assert result is None


def test_create_post_raises_when_session_not_ready(monkeypatch, sample_payload):
    # engine or SessionLocal が None のときに RuntimeError
    monkeypatch.setattr(post_module, "engine", None, raising=False)
    monkeypatch.setattr(post_module, "SessionLocal", None, raising=False)
    with pytest.raises(RuntimeError):
        PostService.create_post(**sample_payload)


# ----------------------------
# get_post
# ----------------------------
def test_get_post_found(patch_session_engine, sample_payload):
    found = SimpleNamespace(
        post_id=sample_payload["post_id"],
        user_id=sample_payload["user_id"],  # string_type_user_id
        img_id=sample_payload["img_id"],
        user_question="Q",
        object_label="TGT",
        ai_answer="ANS",
        ai_question="TOI",
        location="札幌市 中央区",
        latitude=43.068,
        longitude=141.35,
        date=dt.datetime.now(dt.timezone.utc),
        updated_at=dt.datetime.now(dt.timezone.utc),
    )
    patch_session_engine.factory = lambda: FakeSession(get_returns={sample_payload["post_id"]: found})
    got = PostService.get_post(sample_payload["post_id"])
    assert got is not None
    assert got["post_id"] == str(sample_payload["post_id"])
    assert got["location"].startswith("札幌市")


def test_get_post_not_found(patch_session_engine, sample_payload):
    patch_session_engine.factory = lambda: FakeSession(get_returns={})
    got = PostService.get_post(sample_payload["post_id"])
    assert got is None


def test_get_post_raises_when_session_not_ready(monkeypatch, sample_payload):
    monkeypatch.setattr(post_module, "engine", None, raising=False)
    monkeypatch.setattr(post_module, "SessionLocal", None, raising=False)
    with pytest.raises(RuntimeError):
        PostService.get_post(sample_payload["post_id"])


# ----------------------------
# list_posts / list_posts_before
# ----------------------------
def test_list_posts_returns_dicts(patch_session_engine):
    row1 = SimpleNamespace(
        post_id=uuid.uuid4(),
        user_id="string_type_user_id",
        img_id=uuid.uuid4(),
        user_question="Q1",
        object_label="T1",
        ai_answer="A1",
        ai_question="TOI1",
        location="札幌市1",
        latitude=43.1,
        longitude=141.1,
        date=dt.datetime.now(dt.timezone.utc),
        updated_at=dt.datetime.now(dt.timezone.utc),
    )
    row2 = SimpleNamespace(
        post_id=uuid.uuid4(),
        user_id="string_type_user_id",
        img_id=uuid.uuid4(),
        user_question="Q2",
        object_label="T2",
        ai_answer="A2",
        ai_question="TOI2",
        location="札幌市2",
        latitude=43.2,
        longitude=141.2,
        date=dt.datetime.now(dt.timezone.utc),
        updated_at=dt.datetime.now(dt.timezone.utc),
    )
    patch_session_engine.factory = lambda: FakeSession(query_rows=[row1, row2])
    got = PostService.list_posts(limit=10, offset=0)
    assert isinstance(got, list)
    assert len(got) == 2
    assert got[0]["user_question"] == "Q1"
    assert got[1]["object_label"] == "T2"


def test_list_posts_before_filters_old(patch_session_engine):
    old = SimpleNamespace(
        post_id=uuid.uuid4(),
        user_id="string_type_user_id",
        img_id=uuid.uuid4(),
        user_question="old",
        object_label="t",
        ai_answer="a",
        ai_question="TOI",
        location="loc",
        latitude=1.0,
        longitude=2.0,
        date=dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=2),
        updated_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=1),
    )
    patch_session_engine.factory = lambda: FakeSession(query_rows=[old])
    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=15)
    got = PostService.list_posts_before(cutoff)
    assert len(got) == 1
    assert got[0]["user_question"] == "old"


def test_list_posts_raises_when_session_not_ready(monkeypatch):
    monkeypatch.setattr(post_module, "engine", None, raising=False)
    monkeypatch.setattr(post_module, "SessionLocal", None, raising=False)
    with pytest.raises(RuntimeError):
        PostService.list_posts()


# ----------------------------
# delete_post
# ----------------------------
def test_delete_post_true(patch_session_engine, sample_payload):
    existing = SimpleNamespace()
    patch_session_engine.factory = lambda: FakeSession(get_returns={sample_payload["post_id"]: existing})
    ok = PostService.delete_post(sample_payload["post_id"])
    assert ok is True


def test_delete_post_false(patch_session_engine, sample_payload):
    patch_session_engine.factory = lambda: FakeSession(get_returns={})
    ok = PostService.delete_post(sample_payload["post_id"])
    assert ok is False


def test_delete_post_raises_when_session_not_ready(monkeypatch, sample_payload):
    monkeypatch.setattr(post_module, "engine", None, raising=False)
    monkeypatch.setattr(post_module, "SessionLocal", None, raising=False)
    with pytest.raises(RuntimeError):
        PostService.delete_post(sample_payload["post_id"])
