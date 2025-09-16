"use client";

import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート

export default function ListPage() {
  const {
    latitude,
    longitude,
    loading: geolocationLoading,
    error: geolocationError,
  } = useGeolocation();

  const { posts, isError: postsError } = usePosts();

  // const isPageLoading = loading || isLoading;

  if (geolocationLoading) {
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
  }

  if (geolocationError || postsError) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        {geolocationError
          ? `現在地の取得に失敗しました: ${geolocationError}`
          : "投稿の取得に失敗しました。"}
      </Typography>
    );
  }

  return (
    <Box sx={{ px: 2.5, py: 2, overflowY: "scroll", height: "100%" }}>
      <Stack spacing={1.5}>
        {(posts || []).map((post) => (
          <DiscoveryCard
            key={post.post_id}
            post={post}
            currentLocation={{ latitude, longitude }}
          />
        ))}
      </Stack>
    </Box>
  );
}
