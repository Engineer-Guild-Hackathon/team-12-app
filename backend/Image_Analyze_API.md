# Image Analyze API 使用マニュアル

本書は、**画像解析（Gemini）** に関するエンドポイントの **リクエスト方法・引数・例・戻り値** をまとめたものです。  
実装はFlaskを用いています。
画像の入力は **multipart/form-data（ファイル）** または **gs:// 形式の GCS URL** を受け付けます。モデル呼び出しは画像サイズにより **インライン（Base64）** と **Files API アップロード** を自動切替します（実装詳細は後述）。 

> **注記**
> - `POST /v1/analyze` は **ファイル or 画像URL（gs://）のどちらかが必須**です。両方渡した場合は、ファイル優先で読み込無実装になっています。   
> - `POST /api/image_analyze` は **画像を保存（GCS + DB）→ 取得した `gs://` を使って Gemini 解析** の順で処理し、結果と `img_id` を返します。   
> - `image_url` は **`gs://` のみ対応**。HTTP(S) など他スキームは **400** になります。   
> - 画像 MIME はサーバ側で処理（`python-magic`）し、**非画像は 400**。空バイトも 400。   
> - モデル出力は **厳密に JSON（target / answer / toi の3フィールド）** にパースして返します。 

---

## エンドポイント一覧

| メソッド | パス | 概要 |
|:--------:|:----|:----|
| POST | `/v1/analyze` | 画像（ファイル or gs://URL）を解析し、**JSON 3フィールド**を返す |
| POST | `/api/image_analyze` | 画像を保存し（GCS+DB）、保存した `gs://` で解析して結果 + `img_id` を返す |

---

## 共通のエラー形式

```json
{
  "error": "メッセージ",
  "detail": "（任意）詳細"
}
```

代表的なステータス:
- `400 Bad Request`（入力エラー・非画像・対応外URL・空データなど）  
- `502 Bad Gateway`（Gemini 呼び出し等の予期しない上流エラーのラップ） 
- `504 Gateway Timeout`（画像取得タイムアウトなど） 
- `503 Service Unavailable`（初期化エラー等／`/api/image_analyze` 側のサービス初期化失敗） 

---

## 1) POST `/v1/analyze` — 画像解析（ファイル or gs://）

### 説明
- マルチパートで **`file`** を送るか、フォームフィールド **`image_url`** に **`gs://` 形式の URL** を指定します（**どちらか必須**）。  
- 画像はバイト列を取得後に MIME を推定し、**画像でない場合は 400**。空データも 400。  
- 画像サイズが小さい場合は **インライン（画像バイト列）**、大きい場合は **Files API** でアップロードしてから Gemini を呼びます。応答テキストは JSON としてパースし、**`{target, answer, toi}`** の辞書として返します。  

### リクエスト（multipart/form-data）
- `file`: 画像ファイル（任意）  
- `image_url`: 画像 URL（任意、**`gs://` のみ対応**）  
- `question`: 解析時の補助質問（任意のテキスト）  
※ `file` または `image_url` の **いずれかは必須**。両方未指定は 400。 

### レスポンス例（200）
```json
{
  "answer": {
    "target": "検知した物体の名前（簡潔）",
    "answer": "物体の詳細な説明・特徴・生態・用途など（日本語で数文）",
    "toi": "その物体に関する興味深い問いを1つ（日本語）"
  }
}
```

### 失敗例（400）
```json
{ "error": "画像ファイルまたは画像URLは必須です" }
```
```json
{ "error": "対応していないURLです。gs:// 形式のGCS URLのみ対応しています。" }
```
```json
{ "error": "画像ファイルではありません" }
```
 

### curl 例（ファイル）
```bash
curl -X POST http://localhost:5001/v1/analyze   -F "file=@/path/to/photo.jpg"   -F "question=この昆虫について教えて"
```

### curl 例（gs://）
```bash
curl -X POST http://localhost:5001/v1/analyze   -F "image_url=gs://your-bucket/images/abc123.jpg"   -F "question=この植物の生態は？"
```

---

## 2) POST `/api/image_analyze` — 画像保存 + 解析（img_id 付き）

### 説明
- **画像と質問を同時に受け取り**、以下を実施する複合 API：  
  1) 画像を **GCS + DB** に保存（`ImageService.save_image`）  
  2) 保存で得た **`gs://`** と質問文を用いて **Gemini 解析**（`AnalyzeService.analyze`）  
  3) 解析結果（`answer`）に **`img_id`** を添えて返却  
  実装は `img_analyze_route.py` の `create_image_and_analyze` を参照。 

### リクエスト（multipart/form-data）
- `img_file`: 画像ファイル（**必須**）  
- `question`: テキスト（**必須**）  
未指定の場合は 400 を返します。 

### レスポンス例（200）
```json
{
  "img_id": "c1c2a3b4-d5e6-f7a8-b9c0-d1e2f3a4b5c6",
  "answer": {
    "target": "検知した物体の名前（簡潔）",
    "answer": "物体の詳細な説明・特徴・生態・用途など（日本語で数文）",
    "toi": "その物体に関する興味深い問いを1つ（日本語）"
  }
}
```

### 失敗例（400 / 502 / 503 / 504）
```json
{ "error": "必須フィールド不足", "detail": "img_fileがありません" }
```
```json
{ "error": "質問文(question)は必須です" }
```
```json
{ "error": "画像の保存に失敗しました" }
```
```json
{ "error": "サービス初期化エラー", "detail": "..." }
```
```json
{ "error": "upstream error: ..." }
```
```json
{ "error": "画像ファイルではありません" }
```
 

### curl 例
```bash
curl -X POST http://localhost:5001/api/image_analyze   -F "img_file=@/path/to/photo.jpg"   -F "question=この魚の特徴を教えて"
```

---

## フロント（fetch）例

### `/v1/analyze`（ファイル）
```js
const fd = new FormData();
fd.append("file", fileInput.files[0]);
fd.append("question", "この昆虫の生態は？");

const resp = await fetch("/v1/analyze", { method: "POST", body: fd });
const data = await resp.json();
console.log(data.answer);
```

### `/v1/analyze`（gs://）
```js
const fd = new FormData();
fd.append("image_url", "gs://your-bucket/images/abc123.jpg");
fd.append("question", "この植物の用途は？");

const resp = await fetch("/v1/analyze", { method: "POST", body: fd });
const data = await resp.json();
console.log(data.answer);
```

### `/api/image_analyze`（保存 + 解析）
```js
const fd = new FormData();
fd.append("img_file", fileInput.files[0]);
fd.append("question", "この被写体の名前は？");

const resp = await fetch("/api/image_analyze", { method: "POST", body: fd });
const data = await resp.json();
console.log(data.img_id, data.answer);
```

---

## 実装詳細（参考）

- **URL 受け取りは gs:// のみ**：HTTP(S) 等は 400。GCS からは `google.cloud.storage` でバイト取得。末尾が`/`であるURL（フォルダ）はエラー。   
- **MIME 検出とバリデーション**：`python-magic` でファイルタイプの検出。`image/*` 以外は拒否。空データも拒否。   
- **サイズに応じた呼び分け**：小さい画像は **JPEG に縮小**して **インライン**（Base64/バイナリ）投稿。大きい画像は **Files API** で一旦アップロード後にモデル生成。どちらも最終出力は **JSON 3フィールド**にパース。   
- **JSON スキーマ強制**：新しい SDK では `response_mime_type="application/json"` と `response_schema` による構造化出力を指定（未対応環境ではフォールバック）。

---

## 付録：関連 API の整合

画像保存や署名 URL の取り扱いは **Image API**, 画像に紐づく投稿の作成・参照は **Posts API** を参照してください。  
- Image API: `/api/images`（アップロード / 取得 / 削除） 
- Posts API: `/api/posts`（作成 / 取得 / 一覧 / recent / 削除） 

