"use client";

import { fetchRecentPublicPostsAction } from "@/app/actions/getRecentAndPostUserIdActions";
import { Post } from "@/types/post";

type SanitizedPost = Omit<Post, "post_id" | "img_id" | "user_id">;

function sanitizePosts(posts: Post[]): SanitizedPost[] {
  return posts.map(({ post_id: _a, img_id: _b, user_id: _c, ...rest }) => rest);
}

function triggerJsonDownload(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  // iOS Safari 対策: a.download がサポートされていない場合
  if (typeof a.download === "undefined") {
    window.open(url, "_blank");
    return;
  }

  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 公開投稿を取得し、指定のカラムを除去したJSONを端末にダウンロードさせる。
 */
export async function downloadRecentPostsJson(filename = "recent_posts.json") {
  const { posts } = await fetchRecentPublicPostsAction();
  const sanitized = sanitizePosts(posts);
  triggerJsonDownload(sanitized, filename);
}
