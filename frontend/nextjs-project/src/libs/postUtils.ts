import { backendFetch } from "@/libs/backendFetch";
import { Post } from "@/types/post";

// v1–v5対応の簡易UUIDチェック
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * IDを指定して単一の投稿を取得するための共通関数。
 * サーバーサイド（APIルート、サーバーコンポーネント）から呼び出す。
 * @param post_id 取得したい投稿のID
 * @returns 成功した場合はPostオブジェクト、失敗した場合はnull
 */
export async function fetchPostById(post_id: string): Promise<Post | null> {
  // UUIDでなければ、APIに問い合わせる前にエラーとする
  if (!UUID_RE.test(post_id)) {
    console.error("Invalid UUID format for post_id:", post_id);
    return null;
  }

  try {
    const res = await backendFetch(`/api/posts/${post_id}`, {
      method: "GET",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error(
        `Backend API failed for post_id ${post_id}. Status: ${res.status}`,
        errorBody,
      );
      return null;
    }

    const data = await res.json();
    if (!data?.post) {
      console.error(
        "Unexpected response shape from post API: missing 'post' key",
      );
      return null;
    }

    return data.post as Post;
  } catch (error) {
    console.error(`Error in fetchPostById for ${post_id}:`, error);
    return null;
  }
}
