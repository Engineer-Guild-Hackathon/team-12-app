"use client";

import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { mockPosts } from "@/data/mockPosts";
import React, { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { fetchPosts } from "@/libs/fetchPosts";
import { Post } from "@/types/post";

export default function ListPage() {
  const { latitude, longitude, loading, error } = useGeolocation();
  // 本当は初期値にmockPostsを入れたくない
  // mapメソッドでエラーになるためいったんmockPostsを入れたい
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    const fetchAndSetPosts = async () => {
      try {
        // TODO: ローディング処理つける
        const signal = ac.signal;
        const fetchedPosts = await fetchPosts(signal);
        setPosts(fetchedPosts);
      } finally {
        // TODO: ローディング終了処理つける
      }
    };

    fetchAndSetPosts();
    return () => ac.abort();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        現在地の取得に失敗しました: {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ px: 2.5, py: 2, overflowY: "scroll", height: "100%" }}>
      <Stack spacing={1.5}>
        {posts.map((post) => (
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
