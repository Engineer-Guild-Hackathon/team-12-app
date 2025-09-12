"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { mockPosts } from "@/data/mockPosts";
import { useGeolocation } from "@/hooks/useGeolocation";

import dynamic from "next/dynamic";
import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

export default function HomePage() {
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };

  // ここで、選択された投稿の状態を管理する
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // マーカーがクリックされた時の処理
  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <Map posts={mockPosts} onMarkerClick={handleMarkerClick} />

      <DiscoveryCardModal
        post={selectedPost}
        currentLocation={currentLocation}
        onClose={handleCloseModal}
      />
    </Box>
  );
}
