"use client";

import { Box, Typography, Stack } from "@mui/material";
import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";
import { useFilterStore } from "@/stores/filterStore";
import { useSearchParams } from "next/navigation";
import { Post } from "@/types/post";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート
import { useAuthStore } from "@/stores/authStore";

interface ListClientProps {
  initialPosts: Post[];
}

export default function ListClient({ initialPosts }: ListClientProps) {
  const {
    latitude,
    longitude,
    loading: geolocationLoading,
    error: geolocationError,
  } = useGeolocation();
  const { sort: currentSort } = useFilterStore();
  const searchParams = useSearchParams();
  const currentScope = searchParams.get("scope");

  // 認証情報を取得
  const user = useAuthStore((state) => state.user);

  const { posts, isError: postsIsError } = usePosts(
    {
      sort: currentSort,
      scope: currentScope,
      userId: user?.uid,
      currentLocation: { latitude, longitude },
    },
    { posts: initialPosts },
  );

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
