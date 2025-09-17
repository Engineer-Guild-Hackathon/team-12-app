import uuid
from typing import Any, Dict

from flask import Blueprint, jsonify, request

# 必要なサービスをインポート
from src.services.post.post import PostService
from src.services.vertex_ai.search import SearchService

# 新しいBlueprintを作成
search_bp = Blueprint("search_bp", __name__)


def _bad_request(msg: str, detail: str | None = None) -> tuple[Any, int]:
    """400 Bad Requestレスポンスを生成するヘルパー関数"""
    payload: Dict[str, Any] = {"error": msg}
    if detail:
        payload["detail"] = detail
    return jsonify(payload), 400


@search_bp.route("/api/search", methods=["GET"])
def search_posts_by_text():
    """
    ユーザーが入力したテキストクエリに基づいて投稿を検索し、
    完全な投稿オブジェクトのリストを返す。
    """
    # 1. URLのクエリパラメータ 'q' から検索キーワードを取得
    search_query = request.args.get("q")
    if not search_query:
        return _bad_request("検索クエリ 'q' が必要です")

    try:
        limit = int(request.args.get("limit", "12"))
    except ValueError:
        return _bad_request("limitは整数で指定してください")

    try:
        # 2. SearchServiceを呼び出して、関連する投稿のIDと基本情報を取得
        search_results = SearchService.search_by_text(search_query, num_results=limit)

        if search_results is None:
            return jsonify({"error": "検索に失敗しました"}), 500
        if not search_results:
            return jsonify({"posts": []}), 200

        # 3. 取得したIDを元に、PostServiceで完全な投稿オブジェクトを取得
        posts = []
        for result in search_results:
            post_id_str = result.get("id")
            if not post_id_str:
                continue

            try:
                post_id = uuid.UUID(hex=post_id_str)
                post_details = PostService.get_post(post_id)
                if post_details:
                    posts.append(post_details)
            except (ValueError, TypeError):
                continue

        return jsonify({"posts": posts}), 200

    except RuntimeError as e:
        return jsonify({"error": "サービス初期化エラー", "detail": str(e)}), 503
    except Exception as e:
        return jsonify({"error": "予期せぬエラーが発生しました", "detail": str(e)}), 500
