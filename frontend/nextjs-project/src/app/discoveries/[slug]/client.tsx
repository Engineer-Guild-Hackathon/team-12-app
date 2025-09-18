"use client";

import React from "react";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discoveries/DiscoveryDetailView";
import { usePostDetail } from "@/hooks/usePostDetail";
import { Box } from "@mui/material";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート
import { useEffect } from "react";

export default function DiscoveryDetailClient({ slug }: { slug: string }) {
  const { post, isLoading, isError } = usePostDetail(slug);

  useEffect(() => {
    // isErrorフラグがtrueになった場合
    if (isError) {
      throw new Error("投稿データの取得に失敗しました。");
    }
    // ローディングが完了したのにpostデータが存在しない場合
    if (!isLoading && !post) {
      throw new Error("指定された投稿が見つかりませんでした。");
    }
  }, [isError, isLoading, post]); // 監視対象の変数を設定

  if (isLoading) {
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
      </Box>
    );
  }
  if (!post) {
    // ガード節
    return null;
  }
  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
