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
    user_id = sa.Column(sa.Uuid, nullable=False)
    img_id = sa.Column(sa.Uuid, nullable=False)

    question = sa.Column(sa.Text, nullable=False)
    target = sa.Column(sa.Text, nullable=False)
    answer = sa.Column(sa.Text, nullable=False)
    toi = sa.Column(sa.Text, nullable=False)
    location = sa.Column(sa.Text, nullable=False)

    latitude = sa.Column(sa.Float, nullable=False)
    longitude = sa.Column(sa.Float, nullable=False)

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


class PostService:
    """Post を Cloud SQL に保存・取得・削除をするサービスクラス"""

    @staticmethod
    def create_post(
        post_id: uuid.UUID,
        user_id: uuid.UUID,
        img_id: uuid.UUID,
        question: str,
        target: str,
        answer: str,
        toi: str,
        location: str,
        latitude: float,
        longitude: float,
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
                    question=question,
                    target=target,
                    answer=answer,
                    toi=toi,
                    location=location,
                    latitude=latitude,
                    longitude=longitude,
                )
                session.add(post)
                session.commit()
                session.refresh(post)

                return {
                    "post_id": str(post.post_id),
                    "user_id": str(post.user_id),
                    "img_id": str(post.img_id),
                    "question": post.question,
                    "target": post.target,
                    "answer": post.answer,
                    "toi": post.toi,
                    "location": post.location,
                    "latitude": post.latitude,
                    "longitude": post.longitude,
                    "date": post.date.isoformat() if post.date else None,
                    "updated_at": post.updated_at.isoformat()
                    if post.updated_at
                    else None,
                }
            except Exception as e:
                session.rollback()
                print(f"ERROR: failed to insert post: {e}")
                return None

    @staticmethod
    def get_post(post_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """post_id で Post を1件取得"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            post = session.get(Post, post_id)
            if not post:
                return None

            return {
                "post_id": str(post.post_id),
                "user_id": str(post.user_id),
                "img_id": str(post.img_id),
                "question": post.question,
                "target": post.target,
                "answer": post.answer,
                "toi": post.toi,
                "location": post.location,
                "latitude": post.latitude,
                "longitude": post.longitude,
                "date": post.date.isoformat() if post.date else None,
                "updated_at": post.updated_at.isoformat() if post.updated_at else None,
            }

    @staticmethod
    def list_posts(limit: int = 10, offset: int = 0) -> List[Dict[str, Any]]:
        """Post を複数件取得"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            posts = (
                session.query(Post)
                .order_by(Post.date.desc())
                .limit(limit)
                .offset(offset)
                .all()
            )
            return [
                {
                    "post_id": str(p.post_id),
                    "user_id": str(p.user_id),
                    "img_id": str(p.img_id),
                    "question": p.question,
                    "target": p.target,
                    "answer": p.answer,
                    "toi": p.toi,
                    "location": p.location,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "date": p.date.isoformat() if p.date else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
                for p in posts
            ]

    @staticmethod
    def list_posts_before(cutoff: datetime.datetime) -> List[Dict[str, Any]]:
        """指定した日時より前に作成された投稿を返す"""
        if SessionLocal is None or engine is None:
            raise RuntimeError("Database is not initialized")

        with SessionLocal() as session:
            rows = (
                session.query(Post)
                .filter(Post.date < cutoff)
                .order_by(Post.date.desc())
                .all()
            )
            return [
                {
                    "post_id": str(p.post_id),
                    "user_id": str(p.user_id),
                    "img_id": str(p.img_id),
                    "question": p.question,
                    "target": p.target,
                    "answer": p.answer,
                    "toi": p.toi,
                    "location": p.location,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "date": p.date.isoformat() if p.date else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
                for p in rows
            ]

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


# --- アプリ終了時のクリーンアップ ---
def close_db():
    disconnect_db(engine, connector)
