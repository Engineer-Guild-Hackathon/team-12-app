# Cloud Run への Github Actions を利用したデプロイの設定方法備忘録

作成日: 2025年9月17日(水)

## 作成者
泉知成

## 1. Workload Identity Pool / Provider を作成
```bash
export PROJECT_ID=<PROJECT_ID>
export OWNER="<GITHUB_OWNER>"
export REPO="<GITHUB_REPO>"
export BRANCH="main"
export WORKFLOW_FILE="deploy.yml"

COND="attribute.repository=='${OWNER}/${REPO}' && attribute.ref=='refs/heads/${BRANCH}' && attribute.workflow_ref=='${OWNER}/${REPO}/.github/workflows/${WORKFLOW_FILE}@refs/heads/${BRANCH}'"

gcloud iam workload-identity-pools providers create-oidc gh-provider   --project="$PROJECT_ID" --location=global   --workload-identity-pool=gh-pool   --display-name="GitHub Provider"   --issuer-uri="https://token.actions.githubusercontent.com"   --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref,attribute.aud=assertion.aud,attribute.workflow_ref=assertion.workflow_ref"   --attribute-condition="$COND"
```

## 2. 新たなサービスアカウントを作成
```bash
gcloud iam service-accounts create gh-deploy-sa   --project=$PROJECT_ID   --display-name="GitHub Deploy Service Account"
```

## 3. Github Secrets に入れる値の確認
### GCP_WORKLOAD_IDENTITY_PROVIDER
```bash
gcloud iam workload-identity-pools providers describe gh-provider   --project="$PROJECT_ID" --location=global   --workload-identity-pool=gh-pool   --format="value(name)"
```
→ これを `GCP_WORKLOAD_IDENTITY_PROVIDER` として Github Secrets に登録

### GCP_SERVICE_ACCOUNT
```bash
gcloud iam service-accounts describe gh-deploy-sa@$PROJECT_ID.iam.gserviceaccount.com   --project=$PROJECT_ID   --format="value(email)"
```
→ これを `GCP_SERVICE_ACCOUNT` として Github Secrets に登録

## 4. Github Actions がなりすますサービスアカウントにWIFプリンシパルへの権限を付与
```bash
gcloud iam service-accounts add-iam-policy-binding   gh-deploy-sa@$PROJECT_ID.iam.gserviceaccount.com   --project=$PROJECT_ID   --role=roles/iam.serviceAccountTokenCreator   --member="principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/gh-pool/attribute.repository/<GITHUB_OWNER>/<GITHUB_REPO>"
```

## 5. GCP_SERVICE_ACCOUNT に Artifact Registry への Writer 権限を付与
```bash
export LOCATION="asia-northeast1"
export REPO="holo-app-repo"
export DEPLOY_SA="gh-deploy-sa@$PROJECT_ID.iam.gserviceaccount.com"

gcloud artifacts repositories add-iam-policy-binding "${REPO}"   --location "${LOCATION}"   --member "serviceAccount:${DEPLOY_SA}"   --role "roles/artifactregistry.writer"
```

## 6. GCP_SERVICE_ACCOUNT に Cloud Run の管理者権限を付与
```bash
export BACKEND_SA="back-server-sa@$PROJECT_ID.iam.gserviceaccount.com"
export FRONTEND_SA="front-app-sa@$PROJECT_ID.iam.gserviceaccount.com"

# デプロイ用 SA に Cloud Run 管理権限
gcloud projects add-iam-policy-binding "${PROJECT_ID}"   --member "serviceAccount:${DEPLOY_SA}"   --role "roles/run.admin"

# デプロイ用 SA がランタイム SA を使えるようにする
gcloud iam service-accounts add-iam-policy-binding "${BACKEND_SA}"   --member "serviceAccount:${DEPLOY_SA}"   --role "roles/iam.serviceAccountUser"

gcloud iam service-accounts add-iam-policy-binding "${FRONTEND_SA}"   --member "serviceAccount:${DEPLOY_SA}"   --role "roles/iam.serviceAccountUser"
```

## 7. 念の為、実行時のイメージ pull のためにランタイム SA に Reader を付与
```bash
gcloud artifacts repositories add-iam-policy-binding "${REPO}"   --location "${LOCATION}"   --member "serviceAccount:${BACKEND_SA}"   --role "roles/artifactregistry.reader"

gcloud artifacts repositories add-iam-policy-binding "${REPO}"   --location "${LOCATION}"   --member "serviceAccount:${FRONTEND_SA}"   --role "roles/artifactregistry.reader"
```
