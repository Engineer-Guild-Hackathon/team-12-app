# Cloud Run へのデプロイの設定方法備忘録 (手動)

作成日: 2025年9月15日(月)

## 作成者
泉知成


## 0. 事前準備 (1回だけ)
### 0-0. 環境変数の設定
```env
# deploy.env
PROJECT_ID="your-gcp-project-id"
REGION="asia-northeast1"           # 東京
REPO="app-repo"                    # Artifact Registry のDockerリポジトリ名
FRONT_SVC="front-app"
BACK_SVC="back-server"
FRONT_SA_NAME="front-app-sa"
BACK_SA_NAME="back-server-sa"
```
```bash
set -a; source deploy.env; set +a;
```

### 0-1. Artifact Registry
```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```
```bash
# 実行結果
iamcredentials.googleapis.com
Operation "operations/acat.p2-<PROJECT_NUMBER>-915749c9-2486-490b-a6fd-96b4ea896996" finished successfully.
```
```bash
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="App images"
```
```bash
# 実行結果
Create request issued for: [holo-app-repo]
Waiting for operation [projects/<PROJECT_ID>/locations/asia-northeast1/operations/8ccf4acc-556d-4213-9d25-011f955ea6a8] to com
plete...done.
Created repository [holo-app-repo].
```

### 0-2. Service Account の設定
#### フロントエンド側
```bash
gcloud iam service-accounts create $FRONT_SA_NAME --display-name=$FRONT_SA_NAME
```
```bash
# 実行結果
Created service account [front-app-sa].
```

#### バックエンド側
```bash
gcloud iam service-accounts create $BACK_SA_NAME  --display-name=$BACK_SA_NAME
```
```bash
# 実行結果
Created service account [back-server-sa].
```

### 0-3. 環境変数を Secret Manager に登録 (更新されるたびに実行)
```bash
printf '<CLOUD_SQL_INSTANCE>' | gcloud secrets versions add gcp_project \
  --project="${PROJECT_ID}" --data-file=-
printf '<DB_NAME>' | gcloud secrets create db_name \
  --project="${PROJECT_ID}" --data-file=-
printf '<DB_USER>' | gcloud secrets create db_user \
  --project="${PROJECT_ID}" --data-file=-
printf '<GCS_BUCKET>' | gcloud secrets create gcs_bucket \
  --project="${PROJECT_ID}" --data-file=-
printf '<PROJECT_NUMBER>' | gcloud secrets create project_id \
  --project="${PROJECT_ID}" --data-file=-
printf '<SECRET_ID_VALUE>' | gcloud secrets create secret_id \
  --project="${PROJECT_ID}" --data-file=-
printf '<SECRET_VERSION>' | gcloud secrets create version_id \
  --project="${PROJECT_ID}" --data-file=-
printf '<YOUR_REAL_GEMINI_API_KEY>' | gcloud secrets create gemini_api_key \
  --project="${PROJECT_ID}" --data-file=-
printf '<YOUR_REAL_FB_API_KEY>' | gcloud secrets create next_fb_api_key \
  --project="${PROJECT_ID}" --data-file=-
printf '<NEXT_PUBLIC_FB_AUTH_DOMAIN>' | gcloud secrets create next_public_fb_auth_domain \
  --project="${PROJECT_ID}" --data-file=-
printf '<NEXT_PUBLIC_FB_PROJECT_ID>' | gcloud secrets create next_public_fb_project_id \
  --project="${PROJECT_ID}" --data-file=-
printf '<NEXT_PUBLIC_BACKEND_ORIGIN>' | gcloud secrets create next_public_backend_origin \
  --project="${PROJECT_ID}" --data-file=-
printf '<NEXT_PUBLIC_SITE_ORIGIN>' | gcloud secrets create next_public_site_origin \
  --project="${PROJECT_ID}" --data-file=-
printf '<DATA_STORE_ID>' | gcloud secrets create data_store_id --data-file=- --project "${PROJECT_ID}"
```
```bash
# 実行結果
Created version [1] of the secret [gcp_project].
Created version [1] of the secret [db_name].
Created version [1] of the secret [db_user].
Created version [1] of the secret [gcs_bucket].
Created version [1] of the secret [project_id].
Created version [1] of the secret [secret_id].
Created version [1] of the secret [version_id].
Created version [1] of the secret [gemini_api_key].
Created version [1] of the secret [next_fb_api_key].
Created version [1] of the secret [NEXT_PUBLIC_FB_AUTH_DOMAIN].
Created version [1] of the secret [NEXT_PUBLIC_FB_PROJECT_ID].
Created version [1] of the secret [NEXT_PUBLIC_BACKEND_ORIGIN].
Created version [1] of the secret [NEXT_PUBLIC_SITE_ORIGIN].
```

## 1. 初回デプロイ (手動)
### 1-1. イメージがあるかを確認
```bash
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}
```
```bash
#実行結果
Listing items under project <PROJECT_ID>, location asia-northeast1, repository holo-app-repo.

Listed 0 items.
```
出なければ、ローカルで一度ビルド → push するか、Actions を一回走らせる必要がある。

#### ローカル例 (バックエンド)
> CAUTION:
> Apple Silicon　(ARM64) を搭載した macで Docker イメージをビルドした場合、標準では ARM64 の実行環境で起動するため、そのまま Cloud Run の CPU x86_64(AMD64) で実行環境で起動しようとすると、CPUアーキテクチャーが違うせいで Cloud Run では起動できない。
> その場合、`--platform linux/amd64` オプションを `docker build` コマンドに追加して、x86_64(AMD64) 向けのイメージをビルドする必要がある。

```bash
docker buildx build \
  --platform linux/amd64 \
  -f .devcontainer/backend/Dockerfile \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/back-server:latest \
  --push .
```
```bash
# 実行結果
 => [internal] load build definition from Dockerfile                0.0s
 => => transferring dockerfile: 1.19kB                              0.0s
 => [internal] load metadata for docker.io/library/python:3.12-slim 0.9s
 => [internal] load .dockerignore                                   0.0s
 => => transferring context: 2B                                     0.0s
 => [internal] load build context                                   0.0s
 => => transferring context: 6.26kB                                 0.0s
 => [ 1/10] FROM docker.io/library/python:3.12-slim@sha256:         0.0s
 => => resolve docker.io/library/python:3.12-slim@sha256:           0.0s
 => CACHED [ 2/10] RUN apt-get update && apt-get -y install locales && localedef -f UTF-8 -i ja_JP  0.0s
 => CACHED [ 3/10] WORKDIR /backend                                 0.0s
 => CACHED [ 4/10] RUN apt-get update && apt-get install -y --no-install-recommends build-essential  0.0s
 => CACHED [ 5/10] COPY backend/pyproject.toml backend/poetry.lock ./   0.0s
 => CACHED [ 6/10] RUN python -m pip install --upgrade pip && pip install poetry                            0.0s
 => CACHED [ 7/10] RUN pip install gunicorn                         0.0s
 => CACHED [ 8/10] RUN poetry config virtualenvs.create false       0.0s
 => CACHED [ 9/10] RUN poetry install --no-interaction --no-ansi $( [ -n "" ] && echo --with "" )       0.0s
 => CACHED [10/10] COPY backend/ ./                                 0.0s
 => exporting to image     31.9s
 => => exporting layers     0.0s
 => => exporting manifest sha256:                0.0s
 => => exporting config sha256:                  0.0s
 => => exporting attestation manifest sha256:    0.0s
 => => exporting manifest list sha256:           0.0s
 => => pushing layers                            30.8s
 => => pushing manifest for asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/back-server:latest@sha2  1.1s
 => [auth] <PROJECT_ID>/holo-app-repo/back-server:pull,push token for asia-northeast1-docker.pkg.dev           0.0s
```
もう一度、イメージがあるかを確認すると、
```bash
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}
```
```bash
Listing items under project <PROJECT_ID>, location asia-northeast1, repository holo-app-repo.

IMAGE                                                               DIGEST                                                                   CREATE_TIME          UPDATE_TIME          SIZE
asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/back-server  sha256:(省略)  2025-09-15T19:47:16  2025-09-15T19:47:16  450365539
```
ちゃんと上がってる。

#### ローカル例 (フロントエンド)
```bash
docker buildx build \
  --platform linux/amd64 \
  -f .devcontainer/frontend/Dockerfile.prod \
  -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/front-app:latest \
  --build-arg NEXT_PUBLIC_FB_API_KEY="$NEXT_PUBLIC_FB_API_KEY" \
  --build-arg NEXT_PUBLIC_FB_AUTH_DOMAIN="$NEXT_PUBLIC_FB_AUTH_DOMAIN" \
  --build-arg NEXT_PUBLIC_FB_PROJECT_ID="$NEXT_PUBLIC_FB_PROJECT_ID" \
  --push .
```

#### イメージの確認
```bash
gcloud artifacts docker images list \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}
```
```bash
# 実行結果
IMAGE                                                               DIGEST                                                                   CREATE_TIME          UPDATE_TIME          SIZE
asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/back-server  sha256:b2f(略)b3ff1  2025-09-15T19:47:16  2025-09-15T19:47:16  450365539
asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/front-app    sha256:13f(略)61bac  2025-09-15T20:03:35  2025-09-15T20:03:35  82677548
```
イメージが2個できている👍
これは👍
実に👍


## 3. 初回デプロイ (まだ Cloud Run サービスがない場合)
### 3-1. バックエンド
#### バックエンドのサービスアカウントに Secret Manager へのアクセス権を付与
```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
#### バックエンドのサービスアカウントに Cloud SQL へのアクセス権を付与
```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member="serviceAccount:back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```
#### バックエンドのサービスアカウントに Cloud Storage のオブジェクト閲覧権を付与
```bash
gcloud storage buckets add-iam-policy-binding gs://<GCS_BUCKET> \
  --member="serviceAccount:back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer" \
  --project <PROJECT_ID>
```

#### バックエンドのサービスアカウントに Cloud Storage のオブジェクト管理権を付与
```bash
gcloud storage buckets add-iam-policy-binding gs://<GCS_BUCKET> \
  --member="serviceAccount:back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" \
  --project <PROJECT_ID>
```

#### 署名付きURL生成のための権限付与
```bash
gcloud iam service-accounts add-iam-policy-binding \
  back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com \
  --member="serviceAccount:back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project <PROJECT_ID>
```

#### バックエンドの Cloud Run サービスをデプロイ
- backend → 認証必須　のため、`--no-allow-unauthenticated` を指定
```bash
gcloud run deploy back-server \
  --project <PROJECT_ID> \
  --region asia-northeast1 \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/back-server:latest \
  --no-allow-unauthenticated \
  --service-account back-server-sa@<PROJECT_ID>.iam.gserviceaccount.com \
  --add-cloudsql-instances <CLOUD_SQL_INSTANCE> \
  --port 8080 \
  --timeout 300 \
  --set-secrets GCP_PROJECT=gcp_project:latest \
  --set-secrets DB_NAME=db_name:latest \
  --set-secrets DB_USER=db_user:latest \
  --set-secrets GCS_BUCKET=gcs_bucket:latest \
  --set-secrets PROJECT_ID=project_id:latest \
  --set-secrets SECRET_ID=secret_id:latest \
  --set-secrets VERSION_ID=version_id:latest \
  --set-secrets GEMINI_API_KEY=gemini_api_key:latest \
  --set-secrets DATA_STORE_ID=data_store_id:latest \
  --command sh \
  --args=-c \
  --args='exec gunicorn -w 2 --chdir /backend/src -b 0.0.0.0:${PORT} app:app'
```
```bash
# 実行結果
Deploying container to Cloud Run service [back-server] in project [<PROJECT_ID>] region [asia-northeast1]
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
  ✓ Setting IAM Policy...
Done.
Service [back-server] revision [back-server-00021-b6c] has been deployed and is serving 100 percent of traffic.
Service URL: https://back-server-<PROJECT_NUMBER>.asia-northeast1.run.app
```
これで、バックエンドの Cloud Run サービスができた。

### 3-2. フロントエンド
#### フロントエンドのサービスアカウントに Cloud Run Invoker 権限を付与
```bash
FRONT_SA=""
```
```bash
gcloud run services add-iam-policy-binding back-server \
  --project <PROJECT_ID> \
  --region  asia-northeast1 \
  --member  "serviceAccount:front-app-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role    "roles/run.invoker"
```

#### フロントエンドのサービスアカウントに Secret Manager へのアクセス権を付与
```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member "serviceAccount:front-app-sa@<PROJECT_ID>.iam.gserviceaccount.com" \
  --role   "roles/secretmanager.secretAccessor"
```

#### フロントエンドの Cloud Run サービスをデプロイ
frontend → 認証不要
```bash
gcloud run deploy front-app \
  --project <PROJECT_ID> \
  --region  asia-northeast1 \
  --image   asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/front-app:latest \
  --allow-unauthenticated \
  --service-account front-app-sa@<PROJECT_ID>.iam.gserviceaccount.com \
  --set-env-vars NODE_ENV=production,BACKEND_BASE="https://back-server-<PROJECT_NUMBER>.asia-northeast1.run.app,REQUIRE_ID_TOKEN=true" \
  --set-secrets NEXT_PUBLIC_FB_API_KEY=next_public_fb_api_key:latest \
  --set-secrets NEXT_PUBLIC_FB_AUTH_DOMAIN=next_public_fb_auth_domain:latest \
  --set-secrets NEXT_PUBLIC_FB_PROJECT_ID=next_public_fb_project_id:latest \
  --set-secrets NEXT_PUBLIC_BACKEND_ORIGIN=next_public_backend_origin:latest \
  --set-secrets NEXT_PUBLIC_SITE_ORIGIN=next_public_site_origin:latest
```
```bash
# 実行結果
Deploying container to Cloud Run service [front-app] in project [<PROJECT_ID>] region [asia-northeast1]
✓ Deploying... Done.
  ✓ Creating Revision...
  ✓ Routing traffic...
  ✓ Setting IAM Policy...
Done.
Service [front-app] revision [front-app-00002-c2x] has been deployed and is serving 100 percent of traffic.
Service URL: https://front-app-<PROJECT_NUMBER>.asia-northeast1.run.app
```
これで、フロントエンドの Cloud Run サービスができた。

## その他
### フロントエンドからバックエンドの health をチェックする
```bash
RONT_URL="$(gcloud run services describe front-app --project <PROJECT_ID> --region asia-northeast1 --format='value(status.url)')"
curl -i "${FRONT_URL}/api/ping-back"
```
```bash
# 実行結果
HTTP/2 200
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
date: Tue, 16 Sep 2025 07:17:38 GMT
server: Google Frontend
alt-svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000

{"ok":true}
```

### Cloud Run の履歴(直近200件)を確認する
```bash
gcloud run services logs read back-server \
  --project <PROJECT_ID> \
  --region asia-northeast1 \
  --limit 200
```

### 古いイメージの削除
イメージ本体 (特定の digest) を削除する例 (関連タグも消すなら --delete-tags を付与)
```bash
gcloud artifacts docker images delete \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/back-server@sha256:<ここにdigestを入力> \
  --delete-tags --quiet
```
```bash
# 実行結果
Digests:
- asia-northeast1-docker.pkg.dev/<PROJECT_ID>/holo-app-repo/back-server@sha256:<digest>
Delete request issued.
Waiting for operation [projects/<PROJECT_ID>/locations/asia-northeast1/operations/600bbb91-1ae7-43ad-b6da
-4b9311215704] to complete...done.
```

## 環境変数の削除
> CAUTION:
> ERVICE_ACCOUNT_CREDENTIALS を開発環境と同様に渡してしまうと、バックエンドのサービスアカウントを使わずに別のサービスアカウントで動いてしまうため、Cloud SQL や Secret Manager にアクセスできなくなり、エラーになる。
> 誤って設定してしまった場合は、以下のコマンドで削除する。
```bash
gcloud run services update back-server \
  --project <PROJECT_ID> \
  --region asia-northeast1 \
  --remove-env-vars SERVICE_ACCOUNT_CREDENTIALS
```
```bash
gcloud run services describe back-server \
  --project <PROJECT_ID> --region asia-northeast1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```
