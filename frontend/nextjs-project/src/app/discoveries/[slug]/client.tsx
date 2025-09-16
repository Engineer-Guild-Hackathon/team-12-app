"use client";

import React from "react";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discovery-creation/DiscoveryDetailView";
import { usePostDetail } from "@/hooks/usePostDetail";
import { Box } from "@mui/material";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート

export default function DiscoveryDetailClient({ slug }: { slug: string }) {
  const { post, isLoading, isError } = usePostDetail(slug);

  if (isLoading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center", // 横方向の中央揃え
          alignItems: "center", // 縦方向の中央揃え
          height: "100%", // 親要素の高さ全体を使う
          width: "100%", // 親要素の幅全体を使う
        }}
      >
        <LeafyLoader />
      </Box>
    );
  if (isError || !post) return <div>投稿の読み込みに失敗しました。</div>;

  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
