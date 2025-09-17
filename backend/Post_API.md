# Posts API 使用マニュアル

本書は、`/api/posts` 系エンドポイントの **リクエスト方法・引数・例・戻り値** をまとめたものです。  
実装は Flask + SQLAlchemy。保存スキーマは以下（必須のみ抜粋）：`post_id(UUID)`, `user_id`, `img_id(UUID)`, `user_question`, `object_label`, `ai_answer`, `ai_question`, `location`, `latitude(double)`, `longitude(double)` ほか。

> **注記**
> - `POST /api/posts` では **サーバ側で `post_id` を自動生成**します。  
> - `location` は **緯度経度からサーバ側で逆ジオコーディングして補完**します（GeoPy　を利用）。  
> - リクエストの Content-Type は `application/json` を推奨（`application/x-www-form-urlencoded` / `multipart/form-data` も可）。

---

## エンドポイント一覧

| メソッド | パス                       | 概要                                        |
|:--------|:---------------------------|:--------------------------------------------|
| POST    | `/api/posts`               | 新規投稿の作成（`post_id`・`location` はサーバ生成） |
| GET     | `/api/posts/{post_id}`     | 特定投稿を取得                               |
| GET     | `/api/posts`               | 投稿一覧（ページング）                       |
| GET     | `/api/posts/recent`        | 現在時刻から 15 分より前の投稿一覧           |
| DELETE  | `/api/posts/{post_id}`     | 投稿と関連画像を削除                         |

---

## 共通のエラー形式

```json
{
  "error": "メッセージ",
  "detail": "（任意）詳細"
}
```

代表的なステータス:
- `400 Bad Request`（入力エラー・バリデーション不備）
- `404 Not Found`（指定 ID が存在しない）
- `503 Service Unavailable`（DB 初期化エラー）
- `500 Internal Server Error`（保存失敗など一般的失敗）

---

## 1) POST `/api/posts` — 新規作成

### 説明
- サーバ側で `post_id` を `uuid4` で採番。  
- `latitude` / `longitude` から `location` を自動補完（逆ジオコーディング）。  
- 成功時: `201 Created` と作成された `post` を返します。

### リクエスト（JSON 推奨）

```json
{
  "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
  "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
  "user_question": "LLMに質問したい内容のテキスト",
  "object_label": "写真の対象物名のテキスト",
  "ai_answer": "LLMの回答内容のテキスト",
  "ai_question": "LLMからの「問い」のテキスト",
  "latitude": 43.068,
  "longitude": 141.35
}
```

#### フィールド要件
-  `img_id`: UUID 形式必須  
- `user_id`,`user_question`, `object_label`, `ai_answer`, `ai_question`: 空でない文字列必須  
- `latitude`: `-90.0`〜`90.0`  
- `longitude`: `-180.0`〜`180.0`  
- `location`: 送らなくてよい（サーバが補完）

### レスポンス例（201）

```json
{
  "post": {
    "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
    "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
    "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
    "user_question": "LLMに質問したい内容のテキスト",
    "object_label": "写真の対象物名のテキスト",
    "ai_answer": "LLMの回答内容のテキスト",
    "ai_question": "LLMからの「問い」のテキスト",
    "location": "大丸, 北5条西4, 中央区, 札幌市, 石狩振興局, 北海道, 060-0005, 日本",
    "latitude": 43.068,
    "longitude": 141.35,
    "date": "2025-09-11T06:07:50.252702+00:00",
    "updated_at": "2025-09-11T06:07:50.252702+00:00"
  }
}
```

### 失敗例（400）

```json
{
  "error": "入力エラー",
  "detail": "latitude は -90〜90 の範囲で指定してください"
}
```

### curl 例

```bash
curl -X POST http://localhost:5001/api/posts   -H "Content-Type: application/json"   -d '{
    "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
    "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
    "user_question": "LLMに質問したい内容のテキスト",
    "object_label": "写真の対象物名のテキスト",
    "ai_answer": "LLMの回答内容のテキスト",
    "ai_question": "LLMからの「問い」のテキスト",
    "latitude": 43.068,
    "longitude": 141.35
  }'
```

---

## 2) GET `/api/posts/{post_id}` — 1件取得

### 説明
- `post_id`（UUID）で単一の投稿を取得。

### レスポンス例（200）

```json
{
  "post": {
    "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
    "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
    "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
    "user_question": "LLMに質問したい内容のテキスト",
    "object_label": "写真の対象物名のテキスト",
    "ai_answer": "LLMの回答内容のテキスト",
    "ai_question": "LLMからの「問い」のテキスト",
    "location": "大丸, 北5条西4, 中央区, 札幌市, 石狩振興局, 北海道, 060-0005, 日本",
    "latitude": 43.068,
    "longitude": 141.35,
    "date": "2025-09-11T06:07:50.252702+00:00",
    "updated_at": "2025-09-11T06:07:50.252702+00:00"
  }
}
```

### 失敗例（404）

```json
{ "error": "指定された投稿は存在しません" }
```

### curl 例

```bash
curl http://localhost:5001/api/posts/c008f66e-f15b-4cf9-a5be-892dae037726
```

---

## 3) GET `/api/posts` — 一覧（ページング）

### クエリパラメータ
- `limit`（1〜100、デフォルト 10）  
- `offset`（0 以上、デフォルト 0）

### レスポンス例（200）

```json
{
  "posts": [
    {
      "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
      "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
      "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
      "user_question": "LLMに質問したい内容のテキスト",
      "object_label": "写真の対象物名のテキスト",
      "ai_answer": "LLMの回答内容のテキスト",
      "ai_question": "LLMからの「問い」のテキスト",
      "location": "大丸, 北5条西4, 中央区, 札幌市, 石狩振興局, 北海道, 060-0005, 日本",
      "latitude": 43.068,
      "longitude": 141.35,
      "date": "2025-09-11T06:07:50.252702+00:00",
      "updated_at": "2025-09-11T06:07:50.252702+00:00"
    }
  ],
  "limit": 10,
  "offset": 0
}
```

### 失敗例（400）

```json
{ "error": "limit は 1〜100 の範囲で指定してください" }
```

### curl 例

```bash
curl "http://localhost:5001/api/posts?limit=10&offset=0"
```

---

## 4) GET `/api/posts/recent` — 15 分より前の投稿

### 説明
- サーバ時刻 `now` から 15 分前より **前** に作成された投稿一覧を返します。  
- レスポンスには `before`（カットオフ時刻）と `now` も含まれます。

### レスポンス例（200）

```json
{
  "posts": [
    {
      "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
      "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
      "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
      "user_question": "LLMに質問したい内容のテキスト",
      "object_label": "写真の対象物名のテキスト",
      "ai_answer": "LLMの回答内容のテキスト",
      "ai_question": "LLMからの「問い」のテキスト",
      "location": "大丸, 北5条西4, 中央区, 札幌市, 石狩振興局, 北海道, 060-0005, 日本",
      "latitude": 43.068,
      "longitude": 141.35,
      "date": "2025-09-11T06:07:50.252702+00:00",
      "updated_at": "2025-09-11T06:07:50.252702+00:00"
    }
  ],
  "before": "2025-09-11T05:52:50.000000+00:00",
  "now": "2025-09-11T06:07:50.000000+00:00"
}
```

### curl 例

```bash
curl http://localhost:5001/api/posts/recent
```

---

## 5) DELETE `/api/posts/{post_id}` — 投稿と画像の削除

### 説明
- 指定 `post_id` を物理削除します。  
- 関連する画像（`img_id`）があれば **ベストエフォートで削除**します（失敗しても投稿削除は成功扱い）。

### レスポンス例（200 成功＋画像削除成功）

```json
{
  "status": "deleted",
  "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
  "image_deleted": true
}
```

### レスポンス例（200 成功＋画像削除失敗）

```json
{
  "status": "deleted",
  "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
  "image_deleted": false,
  "image_delete_error": "画像削除サービスに接続できませんでした"
}
```

### 失敗例（404）

```json
{ "error": "指定された投稿は存在しません" }
```

---

## フロント（fetch）例

### 作成（ページ遷移なし）

```js
const payload = {
  user_id: "47b6...08eb",
  img_id: "2220...40b4d",
  user_question: "LLMに質問したい内容のテキスト",
  object_label: "写真の対象物名のテキスト",
  ai_answer: "LLMの回答内容のテキスト",
  ai_question: "LLMからの「問い」のテキスト",
  latitude: 43.068,
  longitude: 141.35
};

const resp = await fetch("/api/posts", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify(payload)
});
const data = await resp.json();
if (resp.ok) {
  console.log("created:", data.post);
} else {
  console.error("error:", data);
}
```

### 削除（ページ遷移なし）

```js
const postId = "c008f66e-f15b-4cf9-a5be-892dae037726";
const resp = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
const data = await resp.json();
if (resp.ok) {
  alert("投稿が削除されました");
} else {
  alert("削除に失敗: " + (data.error || resp.statusText));
}
```

---

## データ例（DB 保存イメージ）

```json
[
  {
    "post_id": "c008f66e-f15b-4cf9-a5be-892dae037726",
    "user_id": "47b6774b-24bb-425d-ba19-04c19b4086eb",
    "img_id": "22204310-037b-4b57-bf98-d90c58d40b4d",
    "user_question": "LLMに質問したい内容のテキスト",
    "object_label": "写真の対象物名のテキスト",
    "ai_answer": "LLMの回答内容のテキスト",
    "ai_question": "LLMからの「問い」のテキスト",
    "location": "大丸, 北5条西4, 中央区, 札幌市, 石狩振興局, 北海道, 060-0005, 日本",
    "latitude": 43.068,
    "longitude": 141.35,
    "date": "2025-09-11T06:07:50.252702+00:00",
    "updated_at": "2025-09-11T06:07:50.252702+00:00"
  }
]
```

---

## 備考
- 逆ジオコーディングは Nominatim（OpenStreetMap）を利用しており、レート制限（概ね 1 req/sec）があります。本番環境ではキャッシュ・バックオフ・キューなどの対策を推奨します。  
- `img_id` に関する外部キー制約は現在付与していません。`images` との整合性をアプリ層で担保する場合は、保存前に存在チェックを行ってください。
