# Image API 使用マニュアル

本書は、`/api/images` 系エンドポイントの **リクエスト方法・引数・例・戻り値** をまとめたものです。  
実装は Flask + SQLAlchemy。画像ファイルは Google Cloud Storage (GCS) に保管し、メタデータは Cloud SQL (PostgreSQL) に保存します。  
保存スキーマ（抜粋）: `img_id(UUID)`, `gcs_uri(TEXT)`, `mime_type(TEXT)`, `size_bytes(BIGINT)`, `sha256_hex(CHAR(64))`, `status(TEXT)`, `created_at(TIMESTAMPTZ)`, `updated_at(TIMESTAMPTZ)`。

> **注記**
> - `POST /api/images` では **サーバ側で `img_id` を自動生成（uuid4）** します。  
> - リクエストの Content-Type は **`multipart/form-data`**（ファイルアップロードのため）を推奨します。  
> - `GET /api/images/{img_id}` は、GCS オブジェクトに直接アクセスするための **一時的な署名付き URL (signed_url)** を返します（デフォルトで 15 分 有効）。  
> - `img_id` に関する外部キー制約はアプリ依存です。必要ならアプリ層で存在チェックを行ってください。

---

## エンドポイント一覧

| メソッド | パス | 概要 |
|:--------:|:----:|:----|
| POST | `/api/images` | 新規画像のアップロード（`img_id` はサーバ生成） |
| GET  | `/api/images/{img_id}` | 特定画像のメタデータと署名付き URL（signed_url）を取得 |
| DELETE | `/api/images/{img_id}` | 特定画像の削除（GCS と DB 両方から物理削除） |

---

## 共通のエラー形式

~~~json
{
  "error": "メッセージ",
  "detail": "（任意）詳細"
}
~~~

代表的なステータス:
- `400 Bad Request`（入力エラー・ファイル形式不正）
- `404 Not Found`（指定 ID が存在しない）
- `503 Service Unavailable`（DB/GCS 初期化エラー）
- `500 Internal Server Error`（保存失敗など一般的失敗）

---

## 1) POST `/api/images` — 新規作成

### 説明
- クライアントから `multipart/form-data` で画像ファイルを受け取り、サーバ側で `img_id` を `uuid4` により採番します。  
- 受信したファイルは GCS に保存し、DB にメタデータ（mime_type, size_bytes, sha256_hex, gcs_uri, status, created_at, updated_at など）を登録します。  
- 保存が完了すると `201 Created` と作成された `image` を返します。

### リクエスト（multipart/form-data）
`img_file` というキーで画像ファイルを送信してください。

#### フィールド要件
- `img_file`: 必須。画像ファイル（例: `image/jpeg`, `image/png`）。  
  - サーバ側で MIME 検証を行い、不正なタイプは `400` を返すこと。  
- （オプション）`original_filename` のようなメタが必要なら追加可能。ただし GCS 上のオブジェクト名は `img_id` を使うことを推奨。

### レスポンス例（201）

~~~json
{
  "image": {
    "img_id": "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
    "gcs_uri": "gs://your-dev-bucket/images/c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 123456,
    "sha256_hex": "a1b2c3d4e5f6...",
    "status": "stored",
    "created_at": "2025-09-12T08:30:00.123456+00:00",
    "updated_at": "2025-09-12T08:30:00.123456+00:00"
  }
}
~~~

### 失敗例（400）

~~~json
{
  "error": "ファイル形式が不正です",
  "detail": "img_file に画像ファイルを指定してください"
}
~~~

### curl 例

~~~bash
# "/path/to/your/photo.jpg" の部分を実際のファイルパスに置き換えてください
curl -X POST http://localhost:5001/api/images \
  -F "img_file=@/path/to/your/photo.jpg"
~~~

---

## 2) GET `/api/images/{img_id}` — 1件取得

### 説明
- `img_id`（UUID）で単一の画像メタデータを取得します。  
- レスポンスには、画像実体にアクセスするための **署名付き URL (signed_url)**（※デフォルト 15 分有効）が含まれます。  
- この URL は `<img src="signed_url">` のように直接画像表示に使用できます。

### レスポンス例（200）

~~~json
{
  "image": {
    "img_id": "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
    "gcs_uri": "gs://your-dev-bucket/images/c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 123456,
    "sha256_hex": "a1b2c3d4e5f6...",
    "status": "stored",
    "signed_url": "https://storage.googleapis.com/your-dev-bucket/images/c1c2a3b4-...?X-Goog-Expires=900&X-Goog-Signature=...",
    "created_at": "2025-09-12T08:30:00.123456+00:00",
    "updated_at": "2025-09-12T08:30:00.123456+00:00"
  }
}
~~~

### 失敗例（404）

~~~json
{
  "error": "指定された画像は存在しないか、保存処理に失敗しています"
}
~~~

### curl 例

~~~bash
curl http://localhost:5001/api/images/c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6
~~~

---

## 3) DELETE `/api/images/{img_id}` — 削除

### 説明
- 指定された `img_id` の画像を GCS と DB の両方から物理削除します（トランザクションやロールバック設計は実装に依存）。  
- 成功時は `200 OK` を返します（`204 No Content` でも可、下記は `200` 例）。

### レスポンス例（200）

~~~json
{
  "status": "deleted",
  "img_id": "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6"
}
~~~

### 失敗例（404）

~~~json
{
  "error": "指定された画像は存在しません"
}
~~~

### curl 例

~~~bash
curl -X DELETE http://localhost:5001/api/images/c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6
~~~

---

## フロント（fetch）例

### 作成（ページ遷移なし、File API を利用）

~~~js
const fileInput = document.querySelector('input[type="file"]');
const formData = new FormData();
formData.append('img_file', fileInput.files[0]);

const resp = await fetch("/api/images", {
  method: "POST",
  body: formData // ブラウザが自動で Content-Type を設定
});
const data = await resp.json();
if (resp.ok) {
  console.log("created:", data.image);
  alert("アップロード成功！ Image ID: " + data.image.img_id);
} else {
  console.error("error:", data);
  alert("アップロード失敗: " + (data.error || data.detail));
}
~~~

### 削除（ページ遷移なし）

~~~js
const imageId = "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6";
const resp = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
const data = await resp.json();
if (resp.ok) {
  alert("画像が削除されました: " + data.img_id);
} else {
  alert("削除に失敗: " + (data.error || "Unknown error"));
}
~~~

---

## データ例（DB 保存イメージ）

~~~json
[
  {
    "img_id": "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
    "gcs_uri": "gs://your-dev-bucket/images/c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6.jpg",
    "mime_type": "image/jpeg",
    "size_bytes": 123456,
    "sha256_hex": "a1b2c3d4e5f6...",
    "status": "stored",
    "created_at": "2025-09-12T08:30:00.123456+00:00",
    "updated_at": "2025-09-12T08:30:00.123456+00:00"
  }
]
~~~

---

## 実装上の注意（運用メモ）
- 署名付き URL の有効期限（例：900 秒 = 15 分）はサービス要件に応じて調整可能。期限情報は API ドキュメントまたはレスポンスの注釈で明記してください。  
- GCS 保存時のオブジェクト命名は `images/{img_id}{ext}` のように `img_id` を使うとトラブルが少ないです（拡張子は MIME から推定する）。  
- アップロード中の途中失敗（GCS に書き込んだが DB 書き込みで失敗等）をどう扱うか（ガーベジコレクション、遅延削除、トランザクション制御）は方針を決めておく。  
- セキュリティ: signed_url は公開可能な URL なので、公開範囲・TTL についてポリシーを定義してください。  
- 大きなファイルの取り扱い（ストリーミングアップロード、サイズ上限）を決め、クライアントにエラーメッセージを返すこと。
