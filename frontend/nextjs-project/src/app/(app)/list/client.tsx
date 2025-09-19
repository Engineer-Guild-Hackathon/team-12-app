"use client";

import { Box, Typography, Stack } from "@mui/material";
import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";
import { useFilterStore } from "@/stores/filterStore";
import { useSearchParams } from "next/navigation";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート
import { SearchBarOnListPage } from "@/components/features/search/SearchBar";
import { useListSearchBar } from "@/hooks/useSearchBar";

import { Post } from "@/types/post";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

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
  const { searchQuery, handleSearch, handleQueryChange } = useListSearchBar();
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
      query: searchQuery,
    },
    { posts: initialPosts },
  );

  useEffect(() => {
    // 投稿の取得でエラーが発生した場合
    if (postsIsError) {
      throw new Error("投稿データの取得に失敗しました。");
    }
    // 現在地の取得でエラーが発生した場合
    if (geolocationError) {
      // geolocationErrorは文字列なのでそのままメッセージに含める
      throw new Error(`現在地の取得に失敗しました: ${geolocationError}`);
    }
  }, [postsIsError, geolocationError]); // 両方のエラー状態を監視

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

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 2.5 },
        py: 2,
        overflowY: "scroll",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <SearchBarOnListPage
        initialQuery={searchQuery}
        onSearch={handleSearch}
        onQueryChange={handleQueryChange}
      />
      <Stack spacing={1.5}>
        {(posts || []).map((post: Post) => (
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
