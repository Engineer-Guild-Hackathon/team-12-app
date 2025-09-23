# バックアップ/リストア ユーティリティ

`backend/src/backup` ディレクトリには、Cloud SQL の `posts` / `images` テーブルおよび Cloud Storage 上の画像オブジェクトをバックアップ・復元する Python スクリプトが配置されています。各ファイルの役割と実行方法、生成物の説明を以下にまとめます。

## スクリプトと役割

### download_backup.py
- Cloud SQL から `posts`, `images` テーブルを取得し、それぞれ JSON で保存します。
- `images` テーブルに存在する `img_id` のうち、`posts` テーブルで参照されているものだけを Cloud Storage からダウンロードします。
- 実行日を自動検出し、`YYYYMMDD` 形式の日付をファイル名やフォルダ名に付与します。
- ダウンロードした画像を `images/YYYYMMDD_images` に保存し、完了後に同じ内容を `images/YYYYMMDD_images.zip` として圧縮します。

### cleanup_orphan_images.py
- 直近の `posts` テーブルバックアップとダウンロード済み画像を比較し、`posts` に存在しない `img_id` の画像ファイルを削除します。
- `--dry-run` オプションで削除対象を確認することができます。

### restore_backup.py
- `download_backup.py` で生成した JSON と画像を指定した日付 (`YYYYMMDD`) から読み込み、Cloud SQL と Cloud Storage に復元します。
- 日付パラメータはコマンドライン引数で受け取り、必要に応じて `--skip-db` / `--skip-gcs` により片側のみ復元することが可能です。

## 実行方法

> 事前に `.env` やサービスアカウント情報など、Cloud SQL・Cloud Storage へアクセスするための環境変数を設定してください。

```bash
# バックアップの取得
python backend/src/backup/download_backup.py

# 投稿データとダウンロード済み画像の整合性チェック (削除対象を確認だけする例)
python backend/src/backup/cleanup_orphan_images.py --dry-run

# 削除の実行
python backend/src/backup/cleanup_orphan_images.py

# バックアップからの復元 (例: 20250922 のバックアップ)
python backend/src/backup/restore_backup.py 20250922

# GCS への画像アップロードをスキップしたい場合
python backend/src/backup/restore_backup.py 20250922 --skip-gcs
```

## 生成されるファイル・ディレクトリ

- `posts_table/YYYYMMDD_posts_backup_data.json`
  - `posts` テーブルを JSON 配列として保存したファイル。
- `images_table/YYYYMMDD_images_backup_data.json`
  - `images` テーブルの内容を JSON 配列として保存。
- `images/YYYYMMDD_images/`
  - `download_backup.py` 実行時に Cloud Storage から取得した画像ファイルが保存されるフォルダ (日付ごとに作成)。
- `images/YYYYMMDD_images.zip`
  - 上記フォルダを ZIP アーカイブしたファイル。バックアップの持ち運びに利用できます。

## ディレクトリ構造

```
backend/src/backup/
├── README.md
├── cleanup_orphan_images.py
├── download_backup.py
├── images/
│   ├── YYYYMMDD_images/
│   └── YYYYMMDD_images.zip
├── images_table/
│   └── YYYYMMDD_images_backup_data.json
├── posts_table/
│   └── YYYYMMDD_posts_backup_data.json
└── restore_backup.py
```

※ `YYYYMMDD` はバックアップ・復元を実行した日付に応じて置き換わります。
