"use server";

import { backendFetch } from "@/libs/backendFetch";
import { revalidatePath } from "next/cache";

export type DeletePostResult = {
  status: "deleted";
  post_id: string;
  image_deleted: boolean | null; // 画像がなければ null、削除試行ありなら true/false
  image_delete_error?: string; // 画像削除失敗時のみ
};

/**
 * 投稿を削除する Server Action。
 * Flask 側の DELETE /api/posts/:post_id を呼び出します。
 *
 * @param post_id UUID文字列
 * @returns 成功: { data }, 失敗: { error }
 */
export async function deletePostAction(
  post_id: string,
): Promise<{ data?: DeletePostResult; error?: string }> {
  try {
    if (!post_id) throw new Error("post_id is required");

    const res = await backendFetch(`/api/posts/${post_id}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok) {
      // Flask は 404/500/503 等で { error, detail? } を返す想定
      const msg =
        json?.error ||
        `Backend API returned HTTP ${res.status}${
          res.statusText ? ` ${res.statusText}` : ""
        }`;
      throw new Error(msg);
    }

    // 期待するレスポンス構造を軽くバリデーション
    // { status: "deleted", post_id: string, image_deleted?: bool|null, image_delete_error?: string }
    if (json?.status !== "deleted" || typeof json?.post_id !== "string") {
      throw new Error("Invalid response structure from Delete Post API");
    }

    // ★ 成功した場合、関連するページのキャッシュを無効化
    // 投稿一覧に影響する可能性のあるページパスを指定
    revalidatePath("/"); // ホームページ（マップ）
    revalidatePath("/list"); // 発見リストページ
    revalidatePath(`/discoveries/${json.post_id}`);

    const data: DeletePostResult = {
      status: "deleted",
      post_id: json.post_id,
      image_deleted:
        typeof json.image_deleted === "boolean" ? json.image_deleted : null,
      ...(json.image_delete_error
        ? { image_delete_error: String(json.image_delete_error) }
        : {}),
    };

    // 一旦dataそのまま返却
    return { data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("deletePostAction Error:", message);
    return { error: message };
  }
}
