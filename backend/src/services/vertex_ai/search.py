import os
import uuid
from typing import List, Optional

from google.api_core.client_options import ClientOptions
from google.cloud.discoveryengine import SearchRequest, SearchServiceClient

# --- Vertex AI Search 設定 ---
GCP_PROJECT_ID = os.environ.get("PROJECT_ID")
GCP_LOCATION = os.environ.get("GCP_LOCATION", "global")
DATA_STORE_ID = os.environ.get("DATA_STORE_ID")

# APIエンドポイントを構築
API_ENDPOINT = (
    f"{GCP_LOCATION}-discoveryengine.googleapis.com" if GCP_LOCATION != "global" else "discoveryengine.googleapis.com"
)


class SearchService:
    """Vertex AI Searchを使って関連投稿を検索するサービスクラス"""

    @staticmethod
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
            document_name = f"projects/{GCP_PROJECT_ID}/locations/{GCP_LOCATION}/dataStores/{DATA_STORE_ID}/documents/{str(post_id)}"
            # query = discoveryengine.Query(document=document_name)

            search_params = {"document": document_name}

            request = SearchRequest(
                serving_config=serving_config,
                params=search_params,
                page_size=num_results + 1,
            )

            response = client.search(request=request)

            print("DEBUG: response raw repr:", repr(response))
            # もし protobuf オブジェクトなら to_dict 的に取り出してみる
            try:
                import google.protobuf.json_format as pf

                print("DEBUG: response json:", pf.MessageToJson(response._pb))
            except Exception:
                pass

            related_post_ids = []
            for result in response.results:
                if result.document.id != str(post_id):
                    related_post_ids.append(result.document.id)

            return related_post_ids[:num_results]

        except Exception as e:
            print(f"ERROR: Vertex AI Search failed for post_id {post_id}: {e}")
            return None
