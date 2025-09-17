// import { cookies } from "next/headers";
// import { auth } from "@/libs/firebase.client";
// import { getAuth } from "firebase-admin/auth";
import ListClient from "./client";
import { fetchRecentPostsAction } from "@/app/actions/getRecentAndPostUserIdActions";

// ページコンポーネントをasyncにする
export default async function ListPage() {
  // 1. サーバーサイドで user_id を決定（簡易: 未ログイン時は空文字で公開のみ）
  // 実環境ではSSRでFirebase Auth検証を行い userId を解決する設計に合わせてください。
  const userId = "";
  try {
    // ここではクッキーやセッションからユーザーIDを取得する実装に置き換えてください
    // 例: const token = cookies().get("idToken")?.value; ...
  } catch {
    /* noop */
  }

  // 2. 15分より前の投稿（可視性フィルタ）を取得
  const { posts } = await fetchRecentPostsAction(userId);

  // 2. 取得したデータをinitialPostsとしてクライアントコンポーネントに渡す
  return <ListClient initialPosts={posts} />;
}
