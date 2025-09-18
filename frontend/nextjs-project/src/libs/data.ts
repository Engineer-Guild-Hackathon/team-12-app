import { Post } from "@/types/post";
import { fetchRecentPublicPostsAction } from "@/app/actions/getRecentAndPostUserIdActions";

/**
 * サーバーサイドで投稿一覧を取得するための関数
 */
export async function getPosts(): Promise<Post[]> {
  // サーバーサイド取得は GET /api/posts/recent（公開のみ）
  const { posts } = await fetchRecentPublicPostsAction();
  return posts;
}
