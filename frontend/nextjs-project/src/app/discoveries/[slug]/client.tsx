"use client";

import React, { useEffect, useState } from "react";
import type { Post } from "@/types/post";
import { fetchSpecificPost } from "@/libs/fetchSpecificPost";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discovery-creation/DiscoveryDetailView";

export default function DiscoveryDetailClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetchSpecificPost(slug, ac.signal)
      .then((fetchedPost) => setPost(fetchedPost))
      .catch((error) => {
        console.error("Error fetching post:", error);
        setPost(null);
      });
    return () => ac.abort();
  }, [slug]);

  if (!post) return null; // ローディング中は何も表示しない（必要ならスピナー等に置換）

  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
