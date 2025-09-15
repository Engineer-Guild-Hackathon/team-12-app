"use client";

import React from "react";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discovery-creation/DiscoveryDetailView";
import { usePostDetail } from "@/hooks/usePostDetail";

export default function DiscoveryDetailClient({ slug }: { slug: string }) {
  const { post, isLoading, isError } = usePostDetail(slug);

  if (isLoading) return <div>投稿を読み込んでいます...</div>;
  if (isError) return <div>投稿の読み込みに失敗しました。</div>;
  if (!post) return null;

  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
