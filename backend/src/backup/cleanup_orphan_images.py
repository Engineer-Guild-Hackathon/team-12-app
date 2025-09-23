# 実行例: python backend/src/backup/cleanup_orphan_images.py --dry-run
"""最新の posts バックアップに存在しない img_id の画像ファイルを削除する。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

BASE_DIR = Path(__file__).resolve().parent
POSTS_TABLE_DIR = BASE_DIR / "posts_table"
IMAGES_DIR = BASE_DIR / "images"


def _find_latest_posts_json(directory: Path) -> Path:
    candidates = sorted(directory.glob("*_posts_backup_data.json"))
    if not candidates:
        raise FileNotFoundError(f"No posts backup JSON files found in {directory}")
    return candidates[-1]


def _load_posts_img_ids(path: Path) -> set[str]:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    img_ids = set()
    for record in data:
        value = record.get("img_id")
        if value is not None:
            img_ids.add(str(value))
    return img_ids


def _iter_image_files(directory: Path) -> Iterable[Path]:
    if not directory.exists():
        return []
    return (path for path in directory.rglob("*") if path.is_file())


def _extract_img_id_from_filename(path: Path) -> str:
    name = path.name
    dot_index = name.find(".")
    return name if dot_index == -1 else name[:dot_index]


def remove_orphan_images(
    posts_json: Path, images_dir: Path, dry_run: bool = False
) -> list[Path]:
    required_img_ids = _load_posts_img_ids(posts_json)
    orphan_files: list[Path] = []

    for file_path in _iter_image_files(images_dir):
        img_id = _extract_img_id_from_filename(file_path)
        if img_id not in required_img_ids:
            orphan_files.append(file_path)

    if dry_run:
        return orphan_files

    for file_path in orphan_files:
        try:
            file_path.unlink()
        except FileNotFoundError:
            continue

    return orphan_files


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--posts-json",
        type=Path,
        default=None,
        help="Path to the posts backup JSON. Defaults to the latest file in posts_table.",
    )
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=IMAGES_DIR,
        help=f"Directory containing downloaded images (default: {IMAGES_DIR}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List orphan files without deleting them.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    posts_json = args.posts_json or _find_latest_posts_json(POSTS_TABLE_DIR)
    images_dir = args.images_dir

    try:
        orphan_files = remove_orphan_images(
            posts_json, images_dir, dry_run=args.dry_run
        )
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: failed to remove orphan images: {exc}")
        return 1

    if args.dry_run:
        print("Orphan files (dry-run):")
        for path in orphan_files:
            print(path)
    else:
        print(f"Deleted {len(orphan_files)} orphan files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
