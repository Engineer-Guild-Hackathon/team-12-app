"use client";

import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";
import { useFilterStore } from "@/stores/filterStore";
import { useSearchParams } from "next/navigation";

export default function ListPage() {
  const {
    latitude,
    longitude,
    loading: geolocationLoading,
    error: geolocationError,
  } = useGeolocation();
  const { sort: currentSort } = useFilterStore();
  const searchParams = useSearchParams();
  const currentScope = searchParams.get("scope");

  // TODO: 認証情報を取得
  const user = { uid: "123e4567-e89b-12d3-a456-426614174000" };

  const {
    posts,
    isLoading: postsIsLoading,
    isError: postsIsError,
  } = usePosts({
    sort: currentSort,
    scope: currentScope,
    userId: user?.uid, // ログインしていない場合はundefinedになる
    currentLocation: { latitude, longitude },
  });

  const isPageLoading = geolocationLoading || postsIsLoading;

  if (isPageLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (postsIsError) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        投稿データの取得に失敗しました。
      </Typography>
    );
  }

  if (geolocationError) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        現在地の取得に失敗しました: {geolocationError}
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
        {(!posts || posts.length === 0) && (
          <Typography
            sx={{
              textAlign: "center",
              p: 1,
              color: "text.secondary",
              color: "kinako.800",
            }}
          >
            条件に合う投稿がありません。
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
