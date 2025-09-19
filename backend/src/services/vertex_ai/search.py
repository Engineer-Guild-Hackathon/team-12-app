import os
import uuid
from typing import Any, Dict, List, Optional

from google.api_core.client_options import ClientOptions
from google.cloud.discoveryengine import SearchRequest, SearchServiceClient

# --- Vertex AI Search 設定 ---
GCP_PROJECT_ID = os.environ.get("PROJECT_ID")
GCP_LOCATION = os.environ.get("GCP_LOCATION", "global")
DATA_STORE_ID = os.environ.get("DATA_STORE_ID")
COLLECTION_ID = os.environ.get("DATA_COLLECTION", "default_collection")

print(f"DEBUG Project={GCP_PROJECT_ID}, Location={GCP_LOCATION}, DataStore={DATA_STORE_ID}")

# APIエンドポイントを構築
API_ENDPOINT = (
    f"{GCP_LOCATION}-discoveryengine.googleapis.com" if GCP_LOCATION != "global" else "discoveryengine.googleapis.com"
)


class SearchService:
    """Vertex AI Searchを使って関連投稿を検索するサービスクラス"""

    @staticmethod  # この関数は調整中
    def find_related_posts(post_id: uuid.UUID, num_results: int = 5) -> Optional[List[str]]:
        """
        指定されたpost_idに類似した投稿のIDリストを返す。
        """
        if not all([GCP_PROJECT_ID, GCP_LOCATION, DATA_STORE_ID]):
            raise RuntimeError("Vertex AI Search environment variables are not set")

        try:
            client = SearchServiceClient(client_options=ClientOptions(api_endpoint=API_ENDPOINT))

            serving_config = client.serving_config_path(
                project=GCP_PROJECT_ID,
                location=GCP_LOCATION,
                data_store=DATA_STORE_ID,
                serving_config="default_config",
            )

            # ドキュメントの完全なリソース名を指定して、類似検索クエリを作成
            # document_name = f"projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/dataStores/{DATA_STORE_ID}/documents/{str(post_id)}"
            document_name = client.document_path(
                project=GCP_PROJECT_ID,
                location=GCP_LOCATION,
                data_store=DATA_STORE_ID,
                branch="0",  # ← 実運用では branch 名を確認して合わせる
                document=str(post_id),
            )

            request = SearchRequest(
                serving_config=serving_config,
                params={"document": document_name},
                page_size=num_results + 1,
            )

            response = client.search(request=request)

            related_post_ids = []
            for result in response.results:
                if result.document.id != str(post_id):
                    related_post_ids.append(result.document.id)

            return related_post_ids[:num_results]

        except Exception as e:
            print(f"ERROR: Vertex AI Search failed for post_id {post_id}: {e}")
            return None

    @staticmethod
    def search_by_text(search_query: str, num_results: int = 10) -> Optional[List[Dict[str, Any]]]:
        """
        ユーザーが入力したテキストクエリに基づいて投稿を検索する。
        """
        if not all([GCP_PROJECT_ID, GCP_LOCATION, DATA_STORE_ID]):
            raise RuntimeError("Vertex AI Search environment variables are not set")

        try:
            client = SearchServiceClient(client_options=ClientOptions(api_endpoint=API_ENDPOINT))
            serving_config = (
                f"projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/"
                f"collections/{COLLECTION_ID}/dataStores/{DATA_STORE_ID}/servingConfigs/default_config"
            )

            request = SearchRequest(
                serving_config=serving_config,
                query=search_query,
                page_size=num_results,
                # 必要に応じて、要約やクエリ拡張などの高度な機能を追加できます
                # content_search_spec=...
            )

            response = client.search(request=request)

            # 検索結果からIDと、必要であれば他のメタデータも抽出
            search_results = []
            for result in response.results:
                search_results.append({"id": result.document.id, "struct_data": result.document.struct_data})

            return search_results

        except Exception as e:
            print(f"ERROR: Vertex AI Search by text failed for query '{search_query}': {e}")
            return None
