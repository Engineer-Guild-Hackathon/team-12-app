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
          flexDirection: "column", // ★ 1. 要素を縦に並べる
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100svh", // ★ 2. このままでOK (レイアウトに高さがある場合)
          // もし親の高さが不明な場合は minHeight: '100%' or '80vh' などに
          gap: 2, // ★ 3. 要素間の余白を追加（任意）
        }}
      >
        <LeafyLoader />
        <div>discover</div>
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
