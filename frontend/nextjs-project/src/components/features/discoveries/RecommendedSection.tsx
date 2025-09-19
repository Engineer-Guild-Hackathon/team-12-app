"use client";

import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Post } from "@/types/post";
import useSWR from "swr";
import { searchPostsViaRouteHandler } from "@/libs/searchPosts";

type RecommendedSectionProps = {
  post: Post;
};

export default function RecommendedSection({ post }: RecommendedSectionProps) {
  const { latitude, longitude } = useGeolocation();

  const query = useMemo(() => {
    const label = (post.object_label ?? "").trim();
    const date = (post.date ?? "").toString().trim();
    return [label, date].filter(Boolean).join(" ");
  }, [post.object_label, post.date]);

  const { data } = useSWR(
    query ? ["recommended", query] : null,
    async () => {
      const { posts } = await searchPostsViaRouteHandler({
        q: query,
        limit: 4,
      });
      return { posts } as { posts: Post[] };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  const recommended = useMemo(() => {
    const items = data?.posts ?? [];
    return items.filter((p) => p.post_id !== post.post_id).slice(0, 2);
  }, [data?.posts, post.post_id]);

  if (!recommended || recommended.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      {recommended.map((p) => (
        <DiscoveryCard
          key={p.post_id}
          post={p}
          currentLocation={{ latitude, longitude }}
          from="detail"
        />
      ))}
    </Stack>
  );
}
