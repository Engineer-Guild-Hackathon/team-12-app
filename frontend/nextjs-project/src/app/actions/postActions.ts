"use server";

import { revalidatePath } from "next/cache";
import { Post } from "@/types/post";

export type CreatePostPayload = {
  user_id: string;
  img_id: string;
  user_question: string;
  object_label: string;
  ai_answer: string;
  ai_question: string;
  latitude: number;
  longitude: number;
};

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://back-server:5000";

/**
 * 新しい投稿を作成するためのサーバーアクション。
 * @param payload フロントエンドから渡される新しい投稿のデータ
 * @returns 成功した場合は { data: Post }, 失敗した場合は { error: string } 形式のオブジェクト
 */
export async function createPostAction(
  payload: CreatePostPayload,
): Promise<{ data?: Post; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json?.error || `Backend API returned HTTP ${res.status}`);
    }

    // 投稿が成功したら、関連するページのキャッシュを無効化します。
    // これにより、SWRなどでデータを表示しているページが自動的に更新されます。
    revalidatePath("/"); // ホームページ
    revalidatePath("/list"); // 投稿一覧ページ

    return { data: json.post as Post };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("createPostAction Error:", errorMessage);

    return { error: errorMessage };
  }
}
