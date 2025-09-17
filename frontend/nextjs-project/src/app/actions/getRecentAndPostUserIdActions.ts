"use server";

import { backendFetch } from "@/libs/backendFetch";
import { Post } from "@/types/post";

export type RecentPostsResponse = {
  posts: Post[];
  before: string;
  now: string;
};

/**
 * 15分より前の投稿一覧（可視性フィルタ付き）を取得するサーバーアクション。
 * - 他人の投稿は is_public=true のみ
 * - 自分の投稿は公開/非公開ともに含む
 */
export async function fetchRecentPostsAction(
  userId: string,
): Promise<RecentPostsResponse> {
  const res = await backendFetch(`/api/posts/recent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Backend API returned HTTP ${res.status}`);
  }

  const json = (await res.json()) as RecentPostsResponse;
  return json;
}
