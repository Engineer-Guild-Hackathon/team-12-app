import uuid
from unittest.mock import MagicMock, patch

import pytest

# テスト対象のモジュールを 'search_module' としてインポート
import src.services.vertex_ai.search as search_module
from src.services.vertex_ai.search import SearchService


# -------------------------------------------------------------
# Pytestフィクスチャ (テストの準備・後片付け)
# -------------------------------------------------------------
@pytest.fixture
def sample_search_query() -> str:
    """テストで使う共通の検索クエリを返す"""
    return "東京タワー"


@pytest.fixture
def mock_search_response():
    """SearchServiceClient.searchが返す、偽のレスポンスオブジェクトを作成する"""
    # 1. document部分のモックを作成
    mock_document = MagicMock()
    mock_document.id = uuid.uuid4().hex
    mock_document.struct_data = {
        "user_question": "これは何ですか？",
        "object_label": "東京タワー",
    }

    # 2. result部分のモックを作成
    mock_search_result = MagicMock()
    mock_search_result.document = mock_document

    # 3. response全体のモックを作成し、resultsに上記resultを入れる
    mock_response = MagicMock()
    mock_response.results = [mock_search_result]

    return mock_response


# -------------------------------------------------------------
# テストケース
# -------------------------------------------------------------


# --- search_by_text のテスト ---
# @patchデコレータを使い、テスト中だけSearchServiceClientをモックに差し替える
@patch("src.services.vertex_ai.search.SearchServiceClient")
def test_search_by_text_success(mock_client, sample_search_query, mock_search_response, monkeypatch):
    """正常系: テキスト検索が成功し、結果のリストが返されるケース"""
    # --- Arrange (準備) ---
    # 環境変数が設定されているように見せかける
    monkeypatch.setenv("PROJECT_ID", "fake-project")
    monkeypatch.setenv("GCP_LOCATION", "global")
    monkeypatch.setenv("DATA_STORE_ID", "fake-datastore")
    monkeypatch.setenv("DATA_COLLECTION", "default_collection")

    import importlib

    importlib.reload(search_module)

    # モッククライアントのsearchメソッドが、偽のレスポンスを返すように設定
    mock_instance = mock_client.return_value
    mock_instance.search.return_value = mock_search_response


@patch("src.services.vertex_ai.search.SearchServiceClient")
def test_search_by_text_no_results(mock_client, sample_search_query, monkeypatch):
    """正常系: 検索結果が0件だった場合、空のリストが返されるケース"""
    monkeypatch.setenv("PROJECT_ID", "fake-project")
    monkeypatch.setenv("GCP_LOCATION", "global")
    monkeypatch.setenv("DATA_STORE_ID", "fake-datastore")

    # searchメソッドが、resultsが空のレスポンスを返すように設定
    mock_response = MagicMock()
    mock_response.results = []
    mock_instance = mock_client.return_value
    mock_instance.search.return_value = mock_response

    results = SearchService.search_by_text(sample_search_query)

    assert results == []


@patch("src.services.vertex_ai.search.SearchServiceClient")
def test_search_by_text_api_fails_returns_none(mock_client, sample_search_query, monkeypatch):
    """異常系: Google Cloud APIの呼び出しが失敗し、Noneが返るケース"""
    monkeypatch.setenv("PROJECT_ID", "fake-project")
    monkeypatch.setenv("GCP_LOCATION", "global")
    monkeypatch.setenv("DATA_STORE_ID", "fake-datastore")

    # searchメソッドが例外を発生させるように設定
    mock_instance = mock_client.return_value
    mock_instance.search.side_effect = Exception("API call failed (fake)")

    results = SearchService.search_by_text(sample_search_query)

    assert results is None


def test_search_by_text_raises_when_env_vars_missing(monkeypatch):
    """異常系: 必要な環境変数が設定されていない場合にRuntimeErrorを送出するケース"""
    # 意図的に環境変数を未設定の状態にする
    monkeypatch.delenv("PROJECT_ID", raising=False)
    monkeypatch.delenv("GCP_LOCATION", raising=False)
    monkeypatch.delenv("DATA_STORE_ID", raising=False)

    # search.pyを再インポートして、モジュールレベルの変数をリセット
    import importlib

    importlib.reload(search_module)

    with pytest.raises(RuntimeError, match="Vertex AI Search environment variables are not set"):
        search_module.SearchService.search_by_text("any query")
