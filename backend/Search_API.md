本書は、`/api/search`（テキスト検索）エンドポイントの **リクエスト方法・引数・例・戻り値** をまとめたものです。  
実装は Flask を想定し、検索エンジンには Vertex AI Discovery Engine (SearchServiceClient) を利用します。  
今回は「テキストクエリから投稿を検索して投稿オブジェクトを返す機能」のみを扱い、ある投稿から関連投稿を取得する機能は調整中のため本書では扱いません。

> **注記**
> - 本 API は検索バックエンド（Vertex AI Search）への接続設定に環境変数を利用します：`PROJECT_ID`, `GCP_LOCATION`, `DATA_STORE_ID` 等。  
> - サーバ側で検索結果の ID から `PostService.get_post()` を呼び出して完全な投稿オブジェクトを取得し、クライアントへ返します。  
> - エンドポイントは GET メソッドでクエリパラメータを利用します（URL ベースの検索）。

---

## エンドポイント一覧

| メソッド | パス | 概要 |
|:--------:|:----:|:----|
| GET | `/api/search` | テキストクエリ `q` に基づいて投稿を検索し、完全な投稿オブジェクトの配列を返す |

---

## 共通のエラー形式

~~~json
{
  "error": "メッセージ",
  "detail": "（任意）詳細"
}
~~~

代表的なステータス:
- `400 Bad Request`（入力エラー・バリデーション不備）  
- `500 Internal Server Error`（検索サービス呼び出し失敗など）  
- `503 Service Unavailable`（Vertex AI Search の初期化エラーなど）

---

## 1) GET `/api/search` — テキスト検索（q）

### 説明
- クライアントが URL のクエリパラメータ `q` に検索テキストを渡すと、サーバ側で Vertex AI Search（`SearchService.search_by_text`）を呼び出し、検索結果（ドキュメント ID のリスト）を取得します。  
- 取得した ID を元に `PostService.get_post(post_id)` を逐次呼び出し、投稿オブジェクトの配列を構成して返します。  
- `limit` クエリパラメータで返却件数上限を指定できます（省略時 10）。`limit` は整数で解析されます。

### クエリパラメータ
- `q` (必須): 検索テキスト（URL エンコードされた文字列）  
- `limit` (任意): 返却件数の上限。デフォルト `10`。不正な値は `400` を返す。

### リクエスト例（URL）
~~~
GET /api/search?q=%E3%82%B3%E3%83%BC%E3%83%92%E3%83%BC&limit=5
~~~

### レスポンス例（200）
- 検索にヒットした投稿オブジェクトの配列を返します（`posts`）。空ヒット時は空配列を返します。

~~~json
{
  "posts": [
    {
      "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
      "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
      "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
      "question": "LLMに質問したい内容のテキスト",
      "target": "写真の対象物名のテキスト",
      "answer": "LLMの回答内容のテキスト",
      "toi": "LLMからの「問い」のテキスト",
      "ai_reference": "LLMがweb検索で用いたページのURL",
      "location": "大丸, 北5条西4, 中央区, 札幌市, 北海道, 060-0005, 日本",
      "latitude": 43.068,
      "longitude": 141.35,
      "is_public": true,
      "post_rarity": 0,
      "date": "2025-09-11T06:07:50.252702+00:00",
      "updated_at": "2025-09-11T06:07:50.252702+00:00"
    }
    // ... limit 件まで
  ]
}
~~~

### 失敗例（400: q がない / limit が不正）
~~~json
{
  "error": "検索クエリ 'q' が必要です"
}
~~~

または

~~~json
{
  "error": "limitは整数で指定してください"
}
~~~

### 失敗例（500: 検索呼び出し失敗）
~~~json
{
  "error": "検索に失敗しました"
}
~~~

### 失敗例（503: 初期化エラー）
~~~json
{
  "error": "サービス初期化エラー",
  "detail": "Vertex AI Search environment variables are not set"
}
~~~

---

## 実装上のポイント（search.py / search_route.py を踏まえて）

- 環境変数チェック: `PROJECT_ID`, `GCP_LOCATION`, `DATA_STORE_ID` が未設定だと `RuntimeError` を投げる設計です。起動前に必ず環境変数を設定してください。  
- `SearchService.search_by_text(search_query, num_results)` は Vertex AI の `SearchServiceClient.search()` を呼び出し、結果の `result.document.id` と `result.document.struct_data` を返す仕様です。`struct_data` は必要に応じて利用できますが、本エンドポイントでは ID を使って `PostService.get_post()` を呼び出しています。  
- `find_related_posts(post_id)` のような投稿間類似検索は現在調整中（本マニュアル対象外）です。将来追加する場合は `serving_config` の指定や `params` を変更して対応します。  
- `PostService.get_post(post_id)` の戻り値が `None` の場合はその投稿をスキップします（検索結果に含めない）。  
- Vertex AI Search のレスポンスはストリーミング的に返ることがあるため、クライアントライブラリの取り扱いに注意してください（例: for result in response.results）。  
- 異常系（Vertex API の例外など）はログに出力して適切な HTTP ステータス（500 または 503）を返す設計にしてください。

---

## curl 例

~~~bash
# 検索クエリ "コーヒー" を指定して最大 5 件取得
curl "http://localhost:5001/api/search?q=コーヒー&limit=5"
~~~

---

## フロント（fetch）例

~~~js
// シンプルな GET リクエスト例（URL エンコードに注意）
const q = encodeURIComponent("コーヒー");
const limit = 5;
const resp = await fetch(`/api/search?q=${q}&limit=${limit}`);
const data = await resp.json();
if (resp.ok) {
  console.log("posts:", data.posts);
} else {
  console.error("search error:", data);
  alert("検索に失敗しました: " + (data.error || data.detail));
}
~~~

---

## データ例（Vertex Search の内部返却イメージ）
- `SearchService.search_by_text()` は内部的に以下のような構造を想定しています（SearchServiceClient のレスポンスを整形）。

~~~json
[
  { "id": "22204310-037b-4b57-bf98-d90c58d40b4d", "struct_data": { /* ドキュメントの構造化データ */ } },
  { "id": "aabbccdd-1111-2222-3333-444455556666", "struct_data": { /* ... */ } }
]
~~~

この ID リストをもとに `PostService.get_post()` を順次呼び出し、最終的にクライアントへ `posts` 配列で返却します。

---

## 運用メモ・注意点
- Vertex AI のレート制限・課金に注意。開発環境と本番環境で設定や `serving_config` を分けてください。  
- 検索精度改善のために、検索インデックス（ドキュメント）に対するメタデータや検索用フィールド（タイトル、本文、タグなど）を整備すると良いです。  
- 大量ヒット時のページング設計：現状は `limit` による単純な上限のみですが、必要に応じて `page_token` 等を導入してください。  
- セキュリティ：検索クエリに機密情報が含まれうる場合はロギング方針で保護（マスク）してください。  
- テスト：Vertex Search をモックするために、ユニットテストでは `SearchService` の stub / monkeypatch を用いて `search_by_text` が期待どおりの ID リストを返すことを検証してください。

---