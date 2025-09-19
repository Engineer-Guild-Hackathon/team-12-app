"use client";

import React from "react";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discoveries/DiscoveryDetailView";
import { Post } from "@/types/post";

export default function DiscoveryDetailClient({ post }: { post: Post }) {
  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
