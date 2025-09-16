"use client";

import useSWR from "swr";
import { fetcher } from "@/libs/fetcher";
import { Box, Typography, Stack } from "@mui/material";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { Post } from "@/types/post";

interface ListPageClientProps {
  initialPosts: Post[];
}

type PostsApiResponse = {
  posts: Post[];
};

export default function ListPageClient({ initialPosts }: ListPageClientProps) {
  // Geolocationのロジックはそのまま
  const { latitude, longitude, error: geoError } = useGeolocation();

  const key = "/api/posts?limit=100&offset=0";

  // SWRを呼び出すが、`fallbackData`オプションにサーバーからのデータを渡す
  const { data } = useSWR<PostsApiResponse>(key, fetcher, {
    fallbackData: { posts: initialPosts }, // ★★★ ここが重要 ★★★
    refreshInterval: 300000,
  });

  if (geoError) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        ...
      </Typography>
    );
  }

  const posts = data?.posts || [];

  return (
    <Box sx={{ px: 2.5, py: 2, overflowY: "scroll", height: "100%" }}>
      <Stack spacing={1.5}>
        {posts.map((post) => (
          <DiscoveryCard
            key={post.post_id}
            post={post}
            currentLocation={
              latitude && longitude ? { latitude, longitude } : undefined
            }
          />
        ))}
      </Stack>
    </Box>
  );
}
