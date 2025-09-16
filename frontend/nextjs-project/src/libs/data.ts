import { Post } from "@/types/post";

type PostsApiResponse = {
  posts: Post[];
};

/**
 * サーバーサイドで投稿一覧を取得するための関数
 */
export async function getPosts(): Promise<Post[]> {
  // usePostsで使っていたAPIキーを直接指定
  const key = "/api/posts?limit=100&offset=0";

  // Next.jsのfetchはサーバーサイドで賢くキャッシュを扱ってくれます
  // process.env.NEXT_PUBLIC_API_URLは環境に合わせて変更してください
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${key}`);

  if (!res.ok) {
    // エラーハンドリング
    throw new Error("Failed to fetch posts");
  }

  const data: PostsApiResponse = await res.json();
  return data.posts;
}
