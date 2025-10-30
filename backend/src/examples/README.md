# Examples ディレクトリについて

このフォルダは、Backend の各種 API やユーティリティを手軽に試すためのサンプルアプリをまとめたものです。実際の運用コードとは独立して動作するよう構成しています。
動作確認やデバッグ作業、APIサーバー構築時に活用してください。

## サンプル一覧

- [example_image_analyze_v2.py](example_image_analyze_v2.py) / [template/example_image_analyze_v2.html](template/example_image_analyze_v2.html)  
  Flask で `/api/image_analyze` を呼び出すワンページアプリ。Gemini のレスポンス JSON をそのまま表示し、`grounding_urls` の内容を確認できます。

- [example_image_analyze.py](example_image_analyze.py) / [template/example_image_analyze.html](template/example_image_analyze.html)  
  旧構成の画像解析デモ。`/v1/analyze` を直接叩く UI と、`/health`・`/ready` のヘルスチェックボタンが付いています。

- [example_image.py](example_image.py) / [template/example_image.html](template/example_image.html)  
  Cloud Storage + Cloud SQL へ画像を保存し、署名付き URL を取得する API (`/api/images`) の動作確認用。

- [example_post_with_image.py](example_post_with_image.py) / [template/example_post_with_image.html](template/example_post_with_image.html)  
  画像アップロード → 投稿作成 → 一覧取得/削除といった一連のフローを試せる多段 UI。手動で `Post` API を叩く際の参考コードです。

- [example_post.py](example_post.py) / [template/example_post.html](template/example_post.html)  
  投稿作成・取得・削除の最小構成サンプル。フォーム送信で `/api/posts` を操作します。

- [example_post_search.py](example_post_search.py) / [template/example_post_search.html](template/example_post_search.html)  
  投稿検索 API (`/api/search/posts`) の簡易クエリ UI。検索結果を表形式で表示します。

- [example_text_search.py](example_text_search.py) / [template/example_text_search.html](template/example_text_search.html)  
  Vertex AI Search 経由のテキスト検索デモ。キーワードを指定してレスポンスを JSON で確認できます。

- [example_db_direct_connect.py.py](example_db_direct_connect.py.py)  
  Cloud SQL へ直接接続してクエリを投げるサンプル。DB 接続の疎通確認や SQLAlchemy との違いを把握したいときに使用します。

- [example_db_with_utils.py](example_db_with_utils.py)  
  `src.utils.db.cloudsql` を介した接続方法の実例。実サービスと同じユーティリティを使って DB 操作を試せます。

- [example_delete_posts_and_images.py](example_delete_posts_and_images.py) / [template/example_delete_posts_and_images.html](template/example_delete_posts_and_images.html)  
  投稿と画像を同時削除するメンテナンス用ツール。対象 ID を入力して API を呼び出せます。

- [example_generate_strage_url_v4.py](example_generate_strage_url_v4.py)  
  署名付き URL (V4) を生成するスクリプト。生成した URL をブラウザで開き、アクセス可否を確認する用途で利用します。

- [example_get_locationi.py](example_get_locationi.py)  
  緯度・経度から住所文字列を取得する逆ジオコーディングの検証用。`geopy` の使い方を示しています。

## 使い方

1. 必要に応じて `.env` や `backend.env` を設定し、依存サービス（Cloud SQL / Storage など）へ接続できる状態にします。  
2. 任意のサンプルを `python <ファイル名>` で起動し、案内される URL にアクセスしてください。  
3. 実際のレスポンス内容やログを確認しながら、API やユーティリティの挙動を把握します。  

テンプレートを伴う例では `template/` 以下に HTML ファイルを配置しています。スタイルや表示内容を調整したい場合は、該当のテンプレートを編集してください。
