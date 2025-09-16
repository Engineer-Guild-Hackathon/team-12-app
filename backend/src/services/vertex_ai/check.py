import os

print("--- Checking Environment Variables for Vertex AI Search ---")

# search.pyが参照しているものと全く同じ名前の環境変数をチェック
gcp_project_id = os.environ.get("GCP_PROJECT")
gcp_location = os.environ.get("GCP_LOCATION")
data_store_id = os.environ.get("DATA_STORE_ID")

# 結果を分かりやすく表示
print(f"GCP_PROJECT: {gcp_project_id}")
print(f"GCP_LOCATION: {gcp_location}")
print(f"DATA_STORE_ID: {data_store_id}")

print("\n--- Diagnosis ---")
if not all([gcp_project_id, gcp_location, data_store_id]):
    missing = []
    if not gcp_project_id:
        missing.append("GCP_PROJECT")
    if not gcp_location:
        missing.append("GCP_LOCATION")
    if not data_store_id:
        missing.append("DATA_STORE_ID")
    print(f"ERROR: The following environment variables are missing or empty: {', '.join(missing)}")
    print("Please set them in the same terminal before running the application.")
else:
    print("SUCCESS: All required environment variables seem to be set.")

print("-" * 20)
