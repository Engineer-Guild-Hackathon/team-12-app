"""Example tool for deleting posts and their images via simple web form."""

import json
import logging
import os
import re
import uuid
from typing import List, Tuple

from flask import Flask, render_template, request
from src.services.image.image import ImageService
from src.services.post.post import PostService

app = Flask(__name__, template_folder="template")
app.secret_key = "dev-delete-posts-secret"
app.logger.setLevel(logging.INFO)

_UUID_SPLIT_PATTERN = re.compile(r"[,\n]+")


def _parse_post_ids(raw_text: str) -> List[str]:
    """Parse raw textarea input into a list of candidate post_id strings."""
    if not raw_text:
        return []

    raw_text = raw_text.strip()
    if not raw_text:
        return []

    # Try JSON list first (e.g. ["uuid1", "uuid2"])
    try:
        data = json.loads(raw_text)
        if isinstance(data, list):
            return [str(item).strip() for item in data if isinstance(item, (str, int))]
    except json.JSONDecodeError:
        pass

    # Fallback: split by comma / newline
    candidates: List[str] = []
    for token in _UUID_SPLIT_PATTERN.split(raw_text):
        cleaned = token.strip().strip("\"'").strip()
        if cleaned:
            candidates.append(cleaned)
    return candidates


def _delete_post_and_image(post_id_str: str) -> List[Tuple[str, str]]:
    """Delete a post (and its linked image) and return messages for display."""
    messages: List[Tuple[str, str]] = []  # list of (level, message)

    try:
        post_uuid = uuid.UUID(post_id_str)
    except ValueError:
        messages.append(("error", f"post_id の形式が不正です: {post_id_str}"))
        return messages

    try:
        post_data = PostService.get_post(post_uuid)
    except Exception as exc:  # pragma: no cover - defensive
        messages.append(("error", f"投稿取得中にエラーが発生しました ({post_id_str}): {exc}"))
        return messages

    if not post_data:
        messages.append(("error", "post_id に該当する投稿が見つけられませんでした。"))
        return messages

    img_id_str = post_data.get("img_id")

    try:
        deleted = PostService.delete_post(post_uuid)
    except Exception as exc:  # pragma: no cover - defensive
        messages.append(("error", f"投稿削除中にエラーが発生しました ({post_id_str}): {exc}"))
        return messages

    if not deleted:
        messages.append(("error", "post_id に該当する投稿が見つけられませんでした。"))
        return messages

    messages.append(("success", f"post_id={post_id_str} の投稿を削除しました。"))

    if not img_id_str:
        messages.append(("warning", "関連する画像が登録されていませんでした。"))
        return messages

    try:
        img_uuid = uuid.UUID(str(img_id_str))
    except ValueError:
        messages.append(("warning", f"関連画像の img_id の形式が不正です: {img_id_str}"))
        return messages

    try:
        image_deleted = ImageService.delete_image(img_uuid)
    except Exception as exc:  # pragma: no cover - defensive
        messages.append(("error", f"画像削除中にエラーが発生しました ({img_id_str}): {exc}"))
        return messages

    if image_deleted:
        messages.append(("success", f"img_id={img_id_str} の画像を削除しました。"))
    else:
        messages.append(("warning", "post_id に該当する画像が見つけられませんでした。"))

    return messages


@app.route("/", methods=["GET", "POST"])
def index():
    raw_input = ""
    results: List[Tuple[str, str]] = []

    if request.method == "POST":
        raw_input = request.form.get("post_ids_input", "")
        post_ids = _parse_post_ids(raw_input)

        if not post_ids:
            results.append(("error", "post_id の入力が空、または解析できませんでした。"))
        else:
            for post_id in post_ids:
                messages = _delete_post_and_image(post_id)
                results.extend(messages)

    return render_template(
        "example_delete_posts_and_images.html",
        raw_input=raw_input,
        results=results,
    )


def main():
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)


if __name__ == "__main__":
    main()
