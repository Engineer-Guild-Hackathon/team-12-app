#!/usr/bin/env bash
set -euo pipefail

# Deploys/updates the create-vertex-metadata Cloud Run Job and its Scheduler trigger.
# Usage:
#   PROJECT_ID="..." \
#   CLOUD_SQL_INSTANCE="..." \
#   scripts/deploy_create_vertex_metadata.sh [--skip-build]
#
# Required environment variables:
#   PROJECT_ID              GCP project ID
#   CLOUD_SQL_INSTANCE      Fully-qualified Cloud SQL instance name, e.g. project:region:instance
#
# Optional environment variables (have sensible defaults):
#   REGION                  Default: asia-northeast1
#   ARTIFACT_REPO           Artifact Registry repo name. Default: holo-app-repo
#   IMAGE_NAME              Docker image name. Default: create-vertex-metadata
#   DOCKERFILE              Path to Dockerfile. Default: infra/cloud-run-jobs/create-vertex-metadata/Dockerfile
#   BUILD_PLATFORM          docker buildx platform. Default: linux/amd64
#   JOB_NAME                Cloud Run Job name. Default: create-vertex-metadata
#   JOB_SA                  Cloud Run Job service account. Default: vertex-metadata-sa@${PROJECT_ID}.iam.gserviceaccount.com
#   SCHEDULER_JOB           Cloud Scheduler job name. Default: trigger-vertex-metadata
#   SCHEDULER_SA            Scheduler caller SA. Default: scheduler-runner-sa@${PROJECT_ID}.iam.gserviceaccount.com
#   SCHEDULE                Cron schedule. Default: */3 * * * *
#   BUILD_ARGS              Extra args for docker buildx (optional)
#
# Flags:
#   --skip-build            Skip docker build/push and reuse existing image tag

usage() {
  grep '^#' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

BUILD_IMAGE=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      BUILD_IMAGE=0
      shift
      ;;
    --help|-h)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

: "${PROJECT_ID:?PROJECT_ID is required}"
: "${CLOUD_SQL_INSTANCE:?CLOUD_SQL_INSTANCE is required}"

REGION=${REGION:-asia-northeast1}
ARTIFACT_REPO=${ARTIFACT_REPO:-holo-app-repo}
IMAGE_NAME=${IMAGE_NAME:-create-vertex-metadata}
DOCKERFILE=${DOCKERFILE:-infra/cloud-run-jobs/create-vertex-metadata/Dockerfile}
BUILD_PLATFORM=${BUILD_PLATFORM:-linux/amd64}
JOB_NAME=${JOB_NAME:-create-vertex-metadata}
JOB_SA=${JOB_SA:-vertex-metadata-sa@${PROJECT_ID}.iam.gserviceaccount.com}
SCHEDULER_JOB=${SCHEDULER_JOB:-trigger-vertex-metadata}
SCHEDULER_SA=${SCHEDULER_SA:-scheduler-runner-sa@${PROJECT_ID}.iam.gserviceaccount.com}
SCHEDULE=${SCHEDULE:-"*/3 * * * *"}
BUILD_ARGS=${BUILD_ARGS:-}

IMAGE_URI=${IMAGE_URI:-${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${IMAGE_NAME}:latest}
OAUTH_SCOPE="https://www.googleapis.com/auth/cloud-platform"

if [[ ${BUILD_IMAGE} -eq 1 ]]; then
  echo "Building and pushing ${IMAGE_URI}..."
  docker buildx build \
    --platform "${BUILD_PLATFORM}" \
    -f "${DOCKERFILE}" \
    -t "${IMAGE_URI}" \
    ${BUILD_ARGS} \
    --push .
else
  echo "Skipping docker build (using existing image tag ${IMAGE_URI})."
fi

echo "Deploying Cloud Run Job ${JOB_NAME}..."
gcloud run jobs deploy "${JOB_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE_URI}" \
  --service-account "${JOB_SA}" \
  --set-cloudsql-instances "${CLOUD_SQL_INSTANCE}" \
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

echo "Ensuring Cloud Scheduler job ${SCHEDULER_JOB} exists..."
if gcloud scheduler jobs describe "${SCHEDULER_JOB}" --project "${PROJECT_ID}" --location "${REGION}" > /dev/null 2>&1; then
  gcloud scheduler jobs update http "${SCHEDULER_JOB}" \
    --project "${PROJECT_ID}" \
    --location "${REGION}" \
    --schedule "${SCHEDULE}" \
    --uri "https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}:run" \
    --http-method POST \
    --oauth-service-account-email "${SCHEDULER_SA}" \
    --oauth-token-scope "${OAUTH_SCOPE}"
else
  gcloud scheduler jobs create http "${SCHEDULER_JOB}" \
    --project "${PROJECT_ID}" \
    --location "${REGION}" \
    --schedule "${SCHEDULE}" \
    --uri "https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${JOB_NAME}:run" \
    --http-method POST \
    --oauth-service-account-email "${SCHEDULER_SA}" \
    --oauth-token-scope "${OAUTH_SCOPE}" \
    --attempt-deadline 180s
fi

echo "All done. Last execution status:"
gcloud run jobs executions list --job "${JOB_NAME}" --project "${PROJECT_ID}" --region "${REGION}" --limit 1
