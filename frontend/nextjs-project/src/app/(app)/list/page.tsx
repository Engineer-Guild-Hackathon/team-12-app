import { getPosts } from "@/libs/getPosts";
import ListClient from "./client";

// ページコンポーネントをasyncにする
export default async function ListPage() {
  // 1. サーバーサイドで投稿データを取得
  const posts = await getPosts();

  // 2. 取得したデータをinitialPostsとしてクライアントコンポーネントに渡す
  return <ListClient initialPosts={posts} />;
}
