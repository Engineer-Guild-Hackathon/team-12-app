import sqlalchemy as sa

from src.utils.db.cloudsql import connect_db, disconnect_db


def main():
    # DB 初期化
    engine, SessionLocal, Base, connector = connect_db()
    if engine is None:
        print("DB接続に失敗しました。環境変数やSecret Managerを確認してください。")
        return

    # 簡単なクエリを実行
    with engine.connect() as conn:
        result = conn.execute(sa.text("SELECT NOW()")).fetchone()
        print("現在時刻 (DB):", result[0])

    # ORM セッションを使った例
    with SessionLocal() as session:
        # テーブルが存在しない場合の例としてダミーのクエリを投げる
        try:
            rows = session.execute(sa.text("SELECT 'hello world'")).fetchall()
            print("ORM 経由のクエリ結果:", rows)
        except Exception as e:
            print("ORM セッションでのクエリに失敗:", e)

    # 資源を解放
    try:
        disconnect_db(engine, connector)
        print("DB切断に成功しました。")
    except Exception as e:
        print("DB切断に失敗:", e)


if __name__ == "__main__":
    main()
