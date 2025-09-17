import { fetchRecentPostsAction } from "@/app/actions/getRecentAndPostUserIdActions";
import HomeClient from "./client";

// page.tsx は async 関数にする
export default async function HomePage() {
  // 1. サーバーサイドで user_id を決定（簡易: 未ログイン時は空文字で公開のみ）
  // 実環境ではSSRでFirebase Auth検証を行い userId を解決する設計に合わせてください。
  const userId = "";
  try {
    // ここではクッキーやセッションからユーザーIDを取得する実装に置き換えてください
    // 例: const token = cookies().get("idToken")?.value; ...
  } catch {
    /* noop */
  }

  const { posts } = await fetchRecentPostsAction(userId);

  // 2. 取得したデータを initialPosts として HomeClient に渡す
  return <HomeClient initialPosts={posts} />;
}
