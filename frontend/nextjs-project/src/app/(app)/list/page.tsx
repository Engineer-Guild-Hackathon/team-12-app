import { getPosts } from "@/libs/getPosts";
import ListClient from "./client";

export const metadata: Metadata = {
  title: "みんなのはっけん一覧 - holo",
  description:
    "holoで見つけられた「どうして？」の一覧ページです。みんなのはっけんを見てみましょう。",

  // --- OGP (Open Graph) 設定 ---
  openGraph: {
    title: "みんなのはっけん一覧 - holo",
    description:
      "holoで見つけられた「どうして？」の一覧ページです。みんなのはっけんを見てみましょう。",
    url: "https://front-app-708894055394.asia-northeast1.run.app/list",
    siteName: "holo",
    // ★ OGP画像のURLを絶対パスで指定
    images: [
      {
        url: "/logo.svg",
        alt: "holo アプリのロゴ",
      },
    ],
    type: "website",
  },

  // --- Twitterカード設定 ---
  twitter: {
    card: "summary",
    title: "みんなのはっけん一覧 - holo",
    description: "holoで見つけられた「どうして？」の一覧ページです。",
    images: ["/logo.svg"],
  },
};

// ページコンポーネントをasyncにする
export default async function ListPage() {
  // 1. サーバーサイドで投稿データを取得する
  // この await の間、Next.jsが自動的に app/(app)/loading.tsx を表示します
  const posts = await getPosts();

  // 2. 取得したデータをinitialPostsとしてクライアントコンポーネントに渡す
  return <ListClient initialPosts={posts} />;
}
