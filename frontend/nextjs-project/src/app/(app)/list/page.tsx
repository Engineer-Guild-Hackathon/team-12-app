"use client";

import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { usePosts } from "@/hooks/usePosts";

export default function ListPage() {
  const { latitude, longitude, loading, error } = useGeolocation();

  const { posts, isLoading } = usePosts();

  const isPageLoading = loading || isLoading;

  if (isPageLoading) {
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
