"use client";

import { Box, Typography, Stack } from "@mui/material";
import React, { useState, useCallback } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";
import { useFilterStore } from "@/stores/filterStore";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート
import { SearchBarOnListPage } from "@/components/features/search/SearchBar";

import { Post } from "@/types/post";

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
  const router = useRouter();
  const pathname = usePathname();
  const currentScope = searchParams.get("scope");
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("q") ?? "",
  );

  // TODO: 認証情報を取得
  const user = { uid: "123e4567-e89b-12d3-a456-426614174000" };

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

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", q);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleQueryChange = useCallback(
    (q: string) => {
      if (q.trim() === "") {
        setSearchQuery("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
    },
    [pathname, router, searchParams],
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
    <Box
      sx={{
        px: 2.5,
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
