import { getPosts } from "@/libs/data";
import ListClient from "./client";

// ページコンポーネントをasyncにする
export default async function ListPage() {
  // 1. サーバーサイドで投稿データを取得する
  // この await の間、Next.jsが自動的に app/(app)/loading.tsx を表示します
  const posts = await getPosts();

  // 2. 取得したデータをinitialPostsとしてクライアントコンポーネントに渡す
  return <ListClient initialPosts={posts} />;
}
