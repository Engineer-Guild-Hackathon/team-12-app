from __future__ import annotations

import json
import sys
import traceback
import uuid
from collections.abc import Sequence

from src.services.ai.analyze import AnalyzeService
from src.services.image.image import ImageService
from src.services.post.post import PostService


def _log(message: str) -> None:
    """進捗を即時表示するため flush=True でログ出力"""
    print(message, flush=True)


def _validate_post_fields(idx: int, total: int, post: dict) -> tuple[str | None, str]:
    """解析に必要な最低限の情報を確認して返す"""
    post_id = post.get("post_id")
    ai_reference = post.get("ai_reference")

    if not ai_reference:
        _log(f"[{idx}/{total}] post_id={post_id}: ai_reference なし -> スキップ")
        return None, "skipped"

    user_question = post.get("user_question") or ""
    if not user_question:
        _log(f"[{idx}/{total}] post_id={post_id}: user_question なし -> スキップ")
        return None, "skipped"

    return user_question, "ok"


def _resolve_image(idx: int, total: int, post: dict) -> tuple[str | None, str]:
    """画像を取得し gcs_uri を返す"""
    try:
        img_uuid = uuid.UUID(str(post.get("img_id")))
    except Exception:
        _log(
            f"[{idx}/{total}] post_id={post.get('post_id')}: img_id が不正 -> スキップ"
        )
        return None, "failure"

    try:
        image_info = ImageService.get_image(img_uuid)
    except Exception as err:
        _log(f"    ! 画像取得に失敗 (img_id={img_uuid}): {err}")
        traceback.print_exc()
        return None, "failure"

    if not image_info:
        _log(f"    ! 画像情報が見つからない (img_id={img_uuid}) -> スキップ")
        return None, "failure"

    gcs_uri = image_info.get("gcs_uri")
    if not gcs_uri:
        _log(f"    ! gcs_uri が取得できない (img_id={img_uuid}) -> スキップ")
        return None, "failure"

    return gcs_uri, "ok"


def _fetch_grounding_urls(
    gcs_uri: str, user_question: str, location: str | None
) -> list[str]:
    """Gemini で解析し grounding_urls を取得"""
    analyze_result = AnalyzeService.analyze(
        file=None,
        image_url=gcs_uri,
        user_question=user_question,
        location=location,
    )

    if isinstance(analyze_result, dict):
        return analyze_result.get("grounding_urls") or []
    return []


def _pick_reference(urls: list[str]) -> str | None:
    """grounding_urls から利用可能なURLを選ぶ（最初の有効なURLを返す）"""
    for url in urls:
        if isinstance(url, str) and url.strip():
            return url.strip()
    return None


def _load_target_posts(target_post_ids: Sequence[str] | None) -> list[dict]:
    """post_id 指定があれば該当投稿のみ取得、なければ全件取得"""
    if target_post_ids is None:
        return PostService.list_all_posts()
    if not target_post_ids:
        return []

    posts: list[dict] = []
    seen: set[str] = set()

    for raw_post_id in target_post_ids:
        if not isinstance(raw_post_id, str):
            _log(
                f"    ! post_id は文字列で指定してください -> スキップ: {raw_post_id!r}"
            )
            continue

        post_id_str = raw_post_id.strip()
        if not post_id_str:
            _log("    ! 空文字の post_id が指定されました -> スキップ")
            continue

        if post_id_str in seen:
            continue
        seen.add(post_id_str)

        try:
            post_uuid = uuid.UUID(post_id_str)
        except ValueError:
            _log(f"    ! 不正な post_id が指定されました: {post_id_str} -> スキップ")
            continue

        post = PostService.get_post(post_uuid)
        if not post:
            _log(f"    ! post_id={post_id_str} の投稿が見つかりません -> スキップ")
            continue

        posts.append(post)

    return posts


def _process_post(idx: int, total: int, post: dict) -> str:
    """
    単一投稿の ai_reference を再取得し、必要に応じて更新する。

    Returns:
        "updated": 更新成功
        "skipped": 処理不要または要件未充足
        "failure": エラーが発生し更新できなかった
    """
    post_id = post.get("post_id")

    user_question, status = _validate_post_fields(idx, total, post)
    if status != "ok":
        return status

    _log(f"[{idx}/{total}] post_id={post_id}: ai_reference 再取得中...")

    gcs_uri, status = _resolve_image(idx, total, post)
    if status != "ok":
        return status

    grounding_urls: list[str] = []
    attempt = 1
    new_reference: str | None = None
    while True:
        try:
            grounding_urls = _fetch_grounding_urls(
                gcs_uri, user_question, post.get("location")
            )
        except Exception as err:
            _log(f"    ! Gemini解析に失敗: {err}")
            traceback.print_exc()
            return "failure"

        new_reference = _pick_reference(grounding_urls)
        if new_reference:
            break

        _log(
            f"    - グラウンディングURLを取得できませんでした (試行回数: {attempt}) -> 再試行します..."
        )
        attempt += 1

    ai_reference = post.get("ai_reference")

    if not new_reference:
        _log("    - グラウンディングURLを取得できませんでした -> 更新なし")
        return "skipped"

    if new_reference == ai_reference:
        _log("    - URLに変化なし -> 更新不要")
        return "skipped"

    try:
        PostService.update_post(uuid.UUID(str(post_id)), ai_reference=new_reference)
    except Exception as err:
        _log(f"    ! DB更新に失敗: {err}")
        traceback.print_exc()
        return "failure"

    _log(f"    + ai_reference を更新: {new_reference}")
    return "updated"


def main(target_post_ids: Sequence[str] | None = None) -> None:
    """ai_reference を再取得して更新するバッチ処理"""
    _log("=== ai_reference 更新バッチ開始 ===")

    normalized_target_ids = (
        list(target_post_ids) if target_post_ids is not None else None
    )

    posts = _load_target_posts(normalized_target_ids)
    total = len(posts)
    if normalized_target_ids is not None:
        _log(f"指定post_id数: {len(normalized_target_ids)}")
    _log(f"対象件数: {total}")

    if total == 0:
        _log("対象投稿がありません -> 終了")
        return

    updated = 0
    skipped = 0
    failures = 0

    for idx, post in enumerate(posts, start=1):
        result = _process_post(idx, total, post)
        if result == "updated":
            updated += 1
        elif result == "skipped":
            skipped += 1
        else:
            failures += 1

    # 処理結果まとめ
    _log("=== バッチ完了 ===")
    _log(f"更新成功: {updated}")
    _log(f"スキップ: {skipped}")
    _log(f"失敗: {failures}")


if __name__ == "__main__":
    try:
        cli_post_ids: list[str] | None = None
        if len(sys.argv) > 1:
            raw_arg = sys.argv[1]
            parsed_ids: Sequence[str] | None = None
            try:
                parsed = json.loads(raw_arg)
            except Exception:
                parsed = None

            if isinstance(parsed, list) and all(
                isinstance(item, str) for item in parsed
            ):
                parsed_ids = parsed
            else:
                parsed_ids = sys.argv[1:]

            cli_post_ids = list(parsed_ids)

        main(cli_post_ids)
    except KeyboardInterrupt:
        _log("ユーザーによって中断されました")
        sys.exit(1)
