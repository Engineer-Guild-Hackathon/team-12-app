# Cloud Run Job: create-vertex-metadata

- 詳細なセットアップ手順と Cloud Scheduler 連携: [docs/report/20250918_cloud_run_scheduler.md](../../docs/report/20250918_cloud_run_scheduler.md)

## ジョブ概要
`create-vertex-metadata` は、Cloud SQL に保存された投稿データと紐付く画像メタ情報を収集し、Vertex AI Search で取り込める `metadata.jsonl` を生成して GCS にアップロードするバッチジョブです。主な処理は以下の通りです。

1. Cloud SQL (PostgreSQL) から投稿 (`posts`) と画像 (`images`) テーブルを JOIN して取得
2. Vertex AI Search がサポートする MIME タイプのみを対象に JSON Lines を組み立て
3. ローカルファイルとして `metadata.jsonl` を出力
4. 指定バケットの `metadata/metadata.jsonl` にアップロードし、ローカルファイルを削除

## 依存コンポーネント
- Cloud SQL (PostgreSQL) への接続 (`src/utils/db/cloudsql.py`)
- 画像メタ情報: `src/services/image/image.py`
- 投稿データ: `src/services/post/post.py`
- GCS バケットと Vertex AI Search DataStore ID（環境変数 / Secret Manager 経由で注入）

## 想定する実行環境
- Cloud Run Job 上で `python:3.12-slim` ベースのコンテナを起動
- 環境変数は Secret Manager のキーを通じて注入
- Cloud Scheduler から 3 分ごとに REST API (`jobs.run`) で起動

## 補足
- ソース一式は最小限の依存とし、`backend/src/services/{image,post,vertex_ai}` と `backend/src/utils/db` をコンテナにコピーしています。
- Cloud SQL / GCS / Secret Manager へのアクセス権は `vertex-metadata-sa`（想定サービスアカウント）に付与してください。
- `create_vertex_metadata.py` のログで `Upload complete` が出力されれば成功です。失敗時は `ERROR:` 行が残るので Cloud Logging で確認します。
