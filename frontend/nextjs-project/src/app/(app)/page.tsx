import { Metadata } from "next";
import HomeClient from "./client";
import { getPosts } from "@/libs/getPosts";

export const metadata: Metadata = {
  title: "はっけん地図 - holo",
  description:
    "散歩×地図×AIカメラで、日常の「どうして？」を見つけにいくサービスです。あなたの「はっけん」をマップに記録・共有しましょう。",

  // --- OGP (Open Graph) 設定 ---
  openGraph: {
    title: "holo - AIカメラと問いで作る新しい散歩地図",
    description:
      "散歩×地図×AIカメラで、日常の「どうして？」を見つけにいくサービスです。",
    url: "https://front-app-708894055394.asia-northeast1.run.app/",
    siteName: "holo",
    // ★ OGP画像のURLを絶対パスで指定
    images: [
      {
        url: "https://storage.googleapis.com/public-bucket-holo/EGH_202509.png",
        width: 1200,
        height: 675,
        alt: "holo アプリの紹介画像",
      },
    ],
    type: "website",
  },

  // --- Twitterカード設定 ---
  twitter: {
    card: "summary_large_image",
    title: "holo - AIカメラと問いで作る新しい散歩地図",
    description:
      "散歩×地図×AIカメラで、日常の「どうして？」を見つけにいくサービスです。",
    images: [
      "https://storage.googleapis.com/public-bucket-holo/EGH_202509.png",
    ],
  },
};

// page.tsx は async 関数にする
export default async function HomePage() {
  // 1. サーバーサイドで投稿データを取得する
  // この await の間、Next.jsが自動的に app/(app)/loading.tsx を表示します
  const posts = await getPosts();

  // 2. 取得したデータを initialPosts として HomeClient に渡す
  return <HomeClient initialPosts={posts} />;
}
