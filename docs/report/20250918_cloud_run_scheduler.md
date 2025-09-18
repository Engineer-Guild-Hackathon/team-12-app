# 20250918_cloud_run_scheduler.md

作成日: 2025年9月18日(木)

## 作成者
泉知成

## 概要
Vertex AI が類似検索で参照するデータを定期的に更新するために、Cloud Run 上でスケジューラーを動かす仕組みを構築する。


## 1. Cloud Run Job を実行するサービスアカウントの発行
```bash
# 共通変数（必要に応じて変更）
export PROJECT_ID=<PROJECT_ID>
export REGION=asia-northeast1
export JOB_SA_NAME=vertex-metadata-sa
export JOB_SA=${JOB_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
export REPO=<ARTIFACT_REPO>

# サービスアカウント作成
gcloud iam service-accounts create ${JOB_SA_NAME} \
  --project ${PROJECT_ID} \
  --display-name "Cloud Run Job for Vertex metadata"

# Cloud SQL 接続権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member serviceAccount:${JOB_SA} \
  --role roles/cloudsql.client

# Secret Manager 参照権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member serviceAccount:${JOB_SA} \
  --role roles/secretmanager.secretAccessor

# GCS 操作用（バケット横断で付与）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member serviceAccount:${JOB_SA} \
  --role roles/storage.objectAdmin

# Cloud Logging への書き込み権限
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member serviceAccount:${JOB_SA} \
  --role roles/logging.logWriter

# Artifact Registry からイメージ取得
gcloud artifacts repositories add-iam-policy-binding ${REPO} \
  --project ${PROJECT_ID} \
  --location ${REGION} \
  --member serviceAccount:${JOB_SA} \
  --role roles/artifactregistry.reader
```

## 2. Cloud Scheduler を実行するサービスアカウントの発行
```bash
# Scheduler 用サービスアカウントを作る
gcloud iam service-accounts create scheduler-runner-sa \
  --project <PROJECT_ID> \
  --display-name "Scheduler OIDC caller for Cloud Run Job"

# Cloud Run Jobs を呼び出す権限
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member serviceAccount:scheduler-runner-sa@<PROJECT_ID>.iam.gserviceaccount.com \
  --role roles/run.developer

# Cloud Scheduler API を有効化
gcloud services enable cloudscheduler.googleapis.com \
  --project <PROJECT_ID>

# Scheduler サービスエージェントを作成
gcloud beta services identity create \
  --service=cloudscheduler.googleapis.com \
  --project <PROJECT_ID>

# Scheduler サービスエージェントにトークン発行権限
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member serviceAccount:service-<PROJECT_NUMBER>@gcp-sa-cloudscheduler.iam.gserviceaccount.com \
  --role roles/iam.serviceAccountTokenCreator
```

## 3. Dockerfile の作成
`infra/cloud-run-jobs/create-vertex-metadata/Dockerfile` を作成する。
COPY するディレクトリは最小構成にすること。
```Dockerfile
# Python ランタイム（必要に応じて pinned）
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    LANG=ja_JP.UTF-8

WORKDIR /backend

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        g++ \
        python3-dev \
        pkg-config \
        # ★ python-magic が必要とする OS 依存ライブラリ
        libmagic1 \
        libmagic-dev && \
        # （必要に応じて file コマンドも）
        # file && \
    rm -rf /var/lib/apt/lists/*

# 依存物（あなたのプロジェクト構成に合わせて）
COPY backend/pyproject.toml backend/poetry.lock ./
RUN pip install --upgrade pip && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --without dev --no-root

# アプリ本体
COPY backend/src/services/image /backend/src/services/image
COPY backend/src/services/post /backend/src/services/post
COPY backend/src/services/vertex_ai /backend/src/services/vertex_ai
COPY backend/src/utils/db/ /backend/src/utils/db/

# エントリポイント：バッチを 1 回実行して正常終了
ENTRYPOINT ["python", "-u", "src/services/vertex_ai/create_vertex_metadata.py"]
```

## 4. Cloud Run Job のイメージをビルドしてプッシュ
```bash
# 事前に Artifact Registry へ認証（未実施なら一度だけ）
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 共通変数
export PROJECT_ID=<PROJECT_ID>
export REGION=asia-northeast1
export REPO=<ARTIFACT_REPO>
export IMAGE_NAME=create-vertex-metadata
export IMAGE_URI=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:latest
export JOB_NAME=create-vertex-metadata
export JOB_SA=vertex-metadata-sa@${PROJECT_ID}.iam.gserviceaccount.com
export CLOUD_SQL_INSTANCE=<CLOUD_SQL_INSTANCE>

# Apple シリコンから amd64 イメージをビルド＆プッシュ
docker buildx build \
  --platform linux/amd64 \
  -f infra/cloud-run-jobs/create-vertex-metadata/Dockerfile \
  -t ${IMAGE_URI} \
  --push .
```

## 5. Cloud Run Job をデプロイ
```bash
# Cloud Run Job を作成（初回）または更新
gcloud run jobs deploy ${JOB_NAME} \
  --project ${PROJECT_ID} \
  --region ${REGION} \
  --image ${IMAGE_URI} \
  --service-account ${JOB_SA} \
  --set-cloudsql-instances ${CLOUD_SQL_INSTANCE} \
  --set-secrets=GCP_PROJECT=gcp_project:latest \
  --set-secrets=DB_NAME=db_name:latest \
  --set-secrets=DB_USER=db_user:latest \
  --set-secrets=GCS_BUCKET=gcs_bucket:latest \
  --set-secrets=PROJECT_ID=project_id:latest \
  --set-secrets=SECRET_ID=secret_id:latest \
  --set-secrets=VERSION_ID=version_id:latest \
  --set-secrets=GEMINI_API_KEY=gemini_api_key:latest \
  --set-secrets=DATA_STORE_ID=data_store_id:latest \
  --max-retries 1 \
  --task-timeout 900s
```
### 初回だけ動作確認で1回だけ手動実行(任意)
```bash
gcloud run jobs execute ${JOB_NAME} \
  --project ${PROJECT_ID} \
  --region ${REGION}
```

### タスクが成功したかを確認
```bash
EXEC_ID=$(gcloud run jobs executions list --job ${JOB_NAME} --project ${PROJECT_ID} --region ${REGION} --limit 1 --format="value(name)")

gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=${JOB_NAME} AND labels.\"run.googleapis.com/execution_name\"=\"${EXEC_ID}\"" --project ${PROJECT_ID} --limit 50 --format="value(textPayload)"
```

## Cloud Scheduler を作成
```bash
gcloud scheduler jobs update http trigger-vertex-metadata \
  --project ${PROJECT_ID} \
  --location ${REGION} \
  --schedule "*/3 * * * *" \
  --uri "https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}:run" \
  --http-method POST \
  --oauth-service-account-email scheduler-runner-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --oauth-token-scope "https://www.googleapis.com/auth/cloud-platform"
```
