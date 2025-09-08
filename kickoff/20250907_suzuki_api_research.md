# 進捗

- API使う可能性について検討
- 実際にPCで動かそうとして見た（ルートA）
    - 環境構築
        - dockerをWSLに導入した
    - GPTにコード書かせた
    - 各ルート深めていたがチャットの履歴がなくなってしまい明日やりなおす

# 各ルート

## ルートA：**APIフル活用（SaaS連携で最速に作る）**

「撮る→名前判定→雑学→一問生成」を、各社のマルチモーダルAPIで一気にやる路線。まずは精度より“動くもの”を最短で。

**コア流れ**

1. クライアントで撮影 → 画像は一時ストレージに直アップ（例：S3/Cloudflare R2/Supabase Storage）
2. バックエンドは画像URLをLLM(画像対応)に渡し、
    - ①分類（動植物/雲の種類/虫）
    - ②名前の候補＋信頼度
    - ③「雑学・面白ポイント」生成
    - ④「答えのない問い」生成
3. レスポンスを保存し、地図ピンに紐付け

**モデル（例）**

- OpenAI系：GPT-4o系（画像→説明/分類が得意。プロンプトだけで雑学/問いまで生成）
- Google系：Gemini 1.5（長文文脈＋画像理解に強く、地理/自然の説明も安定）
- Anthropic系：Claude（画像理解＋丁寧な説明が得意。問いの質が高い）

※どれも「画像入力OK＆テキスト生成OK」の“マルチモーダルモデル”を選ぶのがポイント。まずは2社くらいでA/Bし、精度とコストで決めるのが現実的。

**画像/文字の投げ方（GCPを使わない場合）**

- 画像：
    - 推奨：**事前署名URL(Presigned URL)** で S3/R2/Supabase に**直アップロード** → その**公開(もしくは期限付き)URL**をAPIに渡す
    - 代替：`multipart/form-data`でAPIサーバへPOST→サーバがストレージに保存→URLでLLMへ
    - 最終手段：Base64エンコードで本文に同梱（大きく非効率・レイテンシ/帯域/コスト悪化）
- 文字：
    - ふつうにJSONの`messages`や`input`に**UTF-8のテキスト**で投げる（LLMベンダの標準SDK or REST）

**画像をどうやって投稿するか（ユーザー視点）**

- フロント：`<input type="file" accept="image/*" capture="environment">` or PWAカメラ
- 直アップ：バックエンドから**PUT用のPresigned URL**を取得→フロントがそこへPUT→完成URLをAPIに渡す
- 進捗：XHRで`onprogress`、10MB超は**クライアント分割アップロード**か**Resumable Upload**を検討

### 具体例

**① 画像の投げ方（GCP不使用）**

- 推奨：S3/Cloudflare R2/Supabase Storage の**署名付きURL直PUT** → 生成された**HTTP(S) URL**をLLMに渡す
- 代替：`multipart/form-data`を自社APIにPOST→バックエンドでストレージ保存→URLでLLMへ
- 非推奨：Base64本文同梱（レイテンシ悪化・タイムアウトリスク）

**② 文字の投げ方**

- JSON（UTF-8）で`messages`/`input`に投げる。system＋user分離。小さな`hints`（季節/場所/時間帯）を添える

**③ モデル候補**

- **OpenAI**：GPT-4o / 4o-mini（JSONモード/関数呼び出しが楽）
- **Google**：Gemini 1.5/2.5（Flash→速い/安価、Pro→難例用）
- **Anthropic**：Claude 3.5 Sonnet（説明の読みやすさと安全性）

**④ 画像投稿の実装方法（フロント）**

- `<input type="file" accept="image/*" capture="environment">` か PWAカメラ
- `/upload/init`で**Presigned URL**取得→フロントが**直PUT**→完了URLを`/analyze`へ

**料金感（相対）**：￥￥（二段推論で実質￥〜￥￥）

**実装難易度**：★☆☆（低）

**補足**：

- **速い**・**作るのが楽**。出典/厳密性はやや弱い → 後からRAGで補強
- レート制限/再試行/JSON検証を入れて運用安定化
- 二段ルータ（Flash/mini→Pro/高性能）でコスト最適化

---

## ルートB：**検索＋RAGで“雑学”を強化（ファインチューニング最小）**

名前当てはAPIに寄せつつ、「雑学」「一問」を**検索/RAGで裏取り**して精度と信頼性を上げる路線。

**コア流れ**

1. 画像→マルチモーダルLLMで**ラベル候補と学名/和名**を抽出
2. Wiki/生物系サイト/気象サイト等をサーバでクローラ or 公式APIで検索
3. 抽出したテキストを**要約＋出典付き**でRAG → 「雑学」生成。「問い」はRAGコンテキストから創発
4. 出典URLを一緒に保存・表示

**モデル**

- LLM：上と同じ（GPT/Gemini/Claudeのマルチモーダル）
- 検索：自前（スクレイピング＋Elasticsearch/Typesense）or Web検索API
- 埋め込み：OpenAI Embeddings / Voyage / Cohere など（日本語強いものがGood）

**投げ方**

- 画像：ルートA同様にURL参照
- 文字：LLMへは**システム/ユーザー/ツール**の役割で、RAGの要約を**長すぎないプロンプト**に整形

**向いてるケース**：出典/根拠が必要、誤情報を避けたい、学習素材をユーザーに示したい

### 具体例

**① 画像の投げ方（GCP不使用）**

- ルートAと同じ（署名付きURL直PUTが最適）

**② 文字の投げ方**

- CVの推論結果（Top-3候補・特長）＋RAG要約をLLMに渡す
- LLMは**整形・要約・「問い」生成**に限定 → トークン/費用が軽い

**③ モデル候補**

- **CV**：YOLOv8/9（検出）＋ViT/Florence-2（タグ/分類）＋CLIP（類似検索）
- **LLM**：GPT-4o-mini / Gemini Flash / Claude Haiku 等の**軽量**
- **RAG**：Wikipedia/Wikidata/iNaturalist/GBIF等を取得→要約

**④ 画像投稿の実装方法**

- Aと同じ（直PUT）。CV用の**推論エンドポイント**を自前運用（Docker/GPU） or 軽量CPUでも可

**料金感（相対）**：￥〜￥￥（LLMは軽い／CVサーバの固定費が別途）

**実装難易度**：★★☆（中）

**補足**：

- **再現性/出典**が取りやすい。UIで「見分けポイント」を明示しやすい
- 初期構築はAより重いが、**スケール時に安く安定**
- 画像が多いほど自前CVのコスパが効く

---

## ルートC：**クラウドマネージド（Bedrock / Vertex AI中心）**

各クラウドの**統合MLOps＋マルチモデル**を使い倒す。ログ/監査/セキュリティ/ワークフローが揃って“運用がラク”。

**Amazon Bedrock 路線（GCP不使用派）**

- **モデル**：Claude系 / Llama系 / Amazon Titan Multi-modal などを**統一API**で利用
- **画像の投げ方（GCP使わない）**：
    - 画像は**S3に直アップ**（Presigned URL）→Bedrockに**S3 URI**またはHTTP URL参照
    - 文字はBedrockの`InvokeModel`にJSONで投入
- **周辺**：Step Functionsでワークフロー、DynamoDBでメタデータ、API Gateway＋LambdaでHTTP化、CloudFrontで配信、Cognitoで認証

**GCP Vertex AI 路線（GCPを使う場合）**

- **モデル**：Gemini（画像/テキスト）、検索拡張（Vertex Search/RAG）
- **画像の投げ方**：Cloud Storageに直アップ→`gs://`参照でGeminiに入力
- **周辺**：Cloud Run/Functions、FireStore/Spanner、Cloud Tasks、Cloud Endpoints / API Gateway

**向いてるケース**：**企業利用/監査**、チーム運用、将来の**オートスケール**と**可観測性**重視

### 具体例

**① 画像の投げ方**

- **Vertex**：GCSに直PUT（署名URL）→`gs://`参照 or Web URL
- **Bedrock**：S3に直PUT → URL/S3参照

**② 文字の投げ方**

- 公式SDK（Vertex AI / Bedrock）でJSON投入。ツール/関数呼び出しも整備

**③ モデル候補**

- **Vertex**：Gemini 1.5/2.5（Flash/Pro）＋ Vertex Search/RAG
- **Bedrock**：Claude 3.5 / Llama系 / Titan、Kendra/KBで根拠付与

**④ 画像投稿の実装方法**

- 直PUT→Cloud Run/Lambdaで推論呼び出し→Cloud Tasks/SQSで非同期

**料金感（相対）**：￥〜￥￥￥（API費＋クラウド基盤費）

**実装難易度**：★★☆〜★★★（中〜高：組織要件があるほど有利）

**補足**：

- 監査・IAM・私設ネットワーク・リージョン要件が**一気通貫**
- 運用ログ/メトリクス/秘密情報管理がやりやすい
- 初期セットアップはAより重いが、**企業運用では最適**