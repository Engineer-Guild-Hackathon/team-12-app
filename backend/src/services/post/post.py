import datetime
import uuid
from typing import Any, Dict, List, Optional

import sqlalchemy as sa
from sqlalchemy.orm import declarative_base
from src.utils.db.cloudsql import connect_db, disconnect_db

# --- DB接続初期化 ---
engine, SessionLocal, Base, connector = connect_db()

# モデル定義だけは可能にしておく（テストやimport時の崩壊防止）
if Base is object:
    Base = declarative_base()


class Post(Base):
    __tablename__ = "posts"

    post_id = sa.Column(sa.Uuid, primary_key=True)
    user_id = sa.Column(sa.Text, nullable=False)
    img_id = sa.Column(sa.Uuid, nullable=False)

    user_question = sa.Column(sa.Text, nullable=False)
    object_label = sa.Column(sa.Text, nullable=False)
    ai_answer = sa.Column(sa.Text, nullable=False)
    ai_question = sa.Column(sa.Text, nullable=False)
    ai_reference = sa.Column(sa.Text, nullable=True)
    location = sa.Column(sa.Text, nullable=False)

    latitude = sa.Column(sa.Float, nullable=False)
    longitude = sa.Column(sa.Float, nullable=False)

    is_public = sa.Column(
        sa.Boolean, nullable=False, server_default=sa.sql.expression.false()
    )
    post_rarity = sa.Column(sa.Integer, nullable=False, server_default=sa.text("0"))

    date = sa.Column(
        sa.TIMESTAMP(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )
    updated_at = sa.Column(
        sa.TIMESTAMP(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
        nullable=False,
    )

    # --- 返却整形を集約 ---
    def to_dict(self) -> Dict[str, Any]:
        """Post オブジェクトを辞書形式に変換して返す"""
        return {
            "post_id": str(self.post_id),
            "user_id": str(self.user_id),
            "img_id": str(self.img_id),
            "user_question": self.user_question,
            "object_label": self.object_label,
            "ai_answer": self.ai_answer,
            "ai_question": self.ai_question,
            "ai_reference": self.ai_reference,
            "location": self.location,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "is_public": self.is_public,
            "post_rarity": self.post_rarity,
            "date": self.date.isoformat() if self.date else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# --- 型/値の正規化ユーティリティ（update_post の冗長性削減用） ---
def _parse_str_required(name: str, v: Any) -> str:
    """必須文字列フィールド"""
    if v is None or not isinstance(v, str):
        raise ValueError(f"{name} は文字列で指定してください")
    return v


def _parse_ai_reference(v: Any) -> Optional[str]:
    """AI 参照フィールド"""
    # ai_reference（NULL 可）
    if v is None:
        return None
    if not isinstance(v, str):
        raise ValueError("ai_reference は文字列または None で指定してください")
    t = v.strip()
    return t or None


def _parse_float(name: str, v: Any) -> float:
    """必須浮動小数点フィールド"""
    # 緯度・経度
    if v is None:
        raise ValueError(f"{name} は None を指定できません")
    try:
        return float(v)
    except (TypeError, ValueError):
        raise ValueError(f"{name} は数値で指定してください")


def _parse_bool(v: Any) -> bool:
    """ブールフィールド"""
    # is_public
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        lowered = v.strip().lower()
        if lowered in {"true", "1", "yes", "on"}:
            return True
        if lowered in {"false", "0", "no", "off", ""}:
            return False
    raise ValueError("is_public は bool もしくはその文字列表現で指定してください")


def _parse_nonneg_int(name: str, v: Any) -> int:
    """非負整数フィールド"""
    # post_rarity
    if v is None:
        raise ValueError(f"{name} は None を指定できません")
    try:
        i = int(v)
    except (TypeError, ValueError):
        raise ValueError(f"{name} は整数で指定してください")
    if i < 0:
        raise ValueError(f"{name} は 0 以上で指定してください")
    return i


def _parse_uuid(name: str, v: Any) -> uuid.UUID:
    """UUID フィールド"""
    # img_id
    if v is None:
        raise ValueError(f"{name} は None を指定できません")
    if isinstance(v, uuid.UUID):
        return v
    if isinstance(v, str):
        try:
            return uuid.UUID(v)
        except ValueError as exc:
            raise ValueError(f"{name} は UUID 形式で指定してください") from exc
    raise ValueError(f"{name} は UUID で指定してください")


class PostService:
    """Post を Cloud SQL に保存・取得・削除をするサービスクラス"""

    @staticmethod
    def create_post(
        post_id: uuid.UUID,
        user_id: str,
        img_id: uuid.UUID,
        user_question: str,
        object_label: str,
        ai_answer: str,
        ai_question: str,
        location: str,
        latitude: float,
        longitude: float,
        ai_reference: str | None = None,
        is_public: bool = False,
        post_rarity: int = 0,
        **kwargs,
    ) -> Optional[Dict[str, Any]]:
        """新しい Post を保存し、作成結果を返す"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            try:
                post = Post(
                    post_id=post_id,
                    user_id=user_id,
                    img_id=img_id,
                    user_question=user_question,
                    object_label=object_label,
                    ai_answer=ai_answer,
                    ai_question=ai_question,
                    ai_reference=ai_reference,
                    location=location,
                    latitude=latitude,
                    longitude=longitude,
                    is_public=is_public if is_public is not None else False,
                    post_rarity=post_rarity if post_rarity is not None else 0,
                )

                if "date" in kwargs:
                    post.date = kwargs["date"]

                session.add(post)
                session.commit()
                session.refresh(post)

                # 返却整形は to_dict() に集約
                return post.to_dict()
            except Exception as e:
                session.rollback()
                print(f"ERROR: failed to insert post: {e}")
                return None

    @staticmethod
    def list_all_posts() -> List[Dict[str, Any]]:
        """公開状態に関わらず全投稿を取得"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            rows = session.query(Post).order_by(Post.date.desc()).all()
            # 返却整形は to_dict() に集約
            return [p.to_dict() for p in rows]

    @staticmethod
    def get_post(post_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """post_id で Post を1件取得"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            post = session.get(Post, post_id)
            if not post:
                return None
            return post.to_dict()

    @staticmethod
    def list_posts(limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Post を複数件取得（公開投稿のみ）"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            posts = (
                session.query(Post)
                .filter(Post.is_public.is_(True))
                .order_by(Post.date.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            # 返却整形は to_dict() に集約
            return [p.to_dict() for p in posts]

    @staticmethod
    def list_posts_before(cutoff: datetime.datetime) -> List[Dict[str, Any]]:
        """指定した日時より前に作成された投稿を返す（公開投稿のみ）"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            rows = (
                session.query(Post)
                .filter(Post.date < cutoff)
                .filter(Post.is_public.is_(True))
                .order_by(Post.date.desc())
                .all()
            )
            return [p.to_dict() for p in rows]

    @staticmethod
    def list_posts_before_with_visibility(
        cutoff: datetime.datetime,
        current_user_id: str,
    ) -> List[Dict[str, Any]]:
        """
        可視性ルールで投稿を返す。
        - 自分の投稿: 時刻制限なしで全件
        - 他人の投稿: cutoff より前 かつ is_public=true のみ
        """
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            rows = (
                session.query(Post)
                .filter(
                    sa.or_(
                        Post.user_id == current_user_id,
                        sa.and_(Post.is_public.is_(True), Post.date < cutoff),
                    )
                )
                .order_by(Post.date.desc())
                .all()
            )
            return [p.to_dict() for p in rows]

    @staticmethod
    def delete_post(post_id: uuid.UUID) -> bool:
        """投稿を削除。成功したら True, 存在しなければ False"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            post = session.get(Post, post_id)
            if not post:
                return False
            session.delete(post)
            session.commit()
            return True

    @staticmethod
    def update_post(post_id: uuid.UUID, **fields: Any) -> Optional[Dict[str, Any]]:
        """
        指定した post_id の投稿内容を更新する。

        Args:
            post_id: 更新対象の投稿ID
            **fields: 更新したいフィールド（user_question, object_label, ai_answer, ai_question,
                      ai_reference, location, latitude, longitude, is_public, post_rarity, img_id）

        Returns:
            更新後の投稿情報。post_id が存在しない場合は None。

        Raises:
            ValueError: フィールド値が不正な場合
        """
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        # 更新対象の正規化マップ（key: 正規化関数）
        normalizers = {
            "user_question": lambda v: _parse_str_required("user_question", v),
            "object_label": lambda v: _parse_str_required("object_label", v),
            "ai_answer": lambda v: _parse_str_required("ai_answer", v),
            "ai_question": lambda v: _parse_str_required("ai_question", v),
            "location": lambda v: _parse_str_required("location", v),
            "ai_reference": _parse_ai_reference,
            "latitude": lambda v: _parse_float("latitude", v),
            "longitude": lambda v: _parse_float("longitude", v),
            "is_public": _parse_bool,
            "post_rarity": lambda v: _parse_nonneg_int("post_rarity", v),
            "img_id": lambda v: _parse_uuid("img_id", v),
        }

        # 許可するキーのみ拾う
        updates = {k: v for k, v in fields.items() if k in normalizers}
        if not updates:
            # 変更指定なし → 現状を返す
            with SessionLocal() as session:
                post = session.get(Post, post_id)
                return post.to_dict() if post else None

        with SessionLocal() as session:
            post = session.get(Post, post_id)
            if not post:
                return None

            changed = False

            # 正規化→差分適用（同値なら代入しない）
            for key, raw in updates.items():
                new_val = normalizers[key](raw)
                if getattr(post, key) != new_val:
                    setattr(post, key, new_val)
                    changed = True

            if changed:
                session.commit()
                session.refresh(post)

            return post.to_dict()


# --- アプリ終了時のクリーンアップ ---
def close_db():
    disconnect_db(engine, connector)
