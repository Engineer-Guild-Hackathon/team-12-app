import { Post } from "@/types/post";
import { backendFetch } from "./backendFetch";

type PostsApiResponse = {
  posts: Post[];
};

/**
 * サーバーサイドで投稿一覧を取得するための関数
 */
export async function getPosts(): Promise<Post[]> {
  // usePostsで使っていたAPIキーを直接指定
  const path = "/api/posts?limit=100&offset=0";

  // 標準のfetchの代わりに、高機能なbackendFetchを使う
  const res = await backendFetch(path, {
    // next: { revalidate: 60 } // 60秒キャッシュするなど、Next.jsのオプションも渡せる
  });

  if (!res.ok) {
    throw new Error("Failed to fetch posts from backend");
  }

  const data: PostsApiResponse = await res.json();
  return data.posts;
}
