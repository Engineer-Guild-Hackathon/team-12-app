import HomeClient from "./client";
import { getPosts } from "@/libs/data";

// page.tsx は async 関数にする
export default async function HomePage() {
  // 1. サーバーサイドで投稿データを取得する
  // この await の間、Next.jsが自動的に app/(app)/loading.tsx を表示します
  const posts = await getPosts();

  // 2. 取得したデータを initialPosts として HomeClient に渡す
  return <HomeClient initialPosts={posts} />;
}
