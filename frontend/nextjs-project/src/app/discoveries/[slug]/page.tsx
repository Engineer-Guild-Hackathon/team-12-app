import { Metadata } from "next";
import DiscoveryDetailClient from "./client";
import { Post } from "@/types/post";
import { fetchPostById } from "@/libs/postUtils";
import { fetchImageRecordById } from "@/libs/imageUtils";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPostData(slug: string): Promise<Post | null> {
  return await fetchPostById(slug);
}

// 動的なメタデータを生成する関数
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostData(slug);

  // 投稿が見つからない場合は、シンプルなメタデータを返す
  if (!post) {
    return {
      title: "投稿が見つかりません",
    };
  }

  // 画像の署名付きURLをサーバーサイドで取得
  const imageRecord = await fetchImageRecordById(post.img_id);
  const imageUrl = imageRecord?.signed_url;

  const pageTitle = `${post.user_question} | holo`;
  const pageDescription = post.ai_answer.substring(0, 120) + "...";

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `https://front-app-708894055394.asia-northeast1.run.app/${slug}`,
      siteName: "holo",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: post.object_label,
            },
          ]
        : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function DiscoveryDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostData(slug);

  return <DiscoveryDetailClient post={post} />;
}
