"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePosts } from "@/hooks/usePosts";

import dynamic from "next/dynamic";
import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

export default function HomePage() {
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };

  const { posts: fetchedPosts, isLoading, isError } = usePosts();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // マーカーがクリックされた時の処理
  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

  if (isError) return <div>データの取得に失敗しました</div>;

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>地図データを読み込んでいます...</div>
      </Box>
    );
  }

  const posts = fetchedPosts || [];

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <Map
        posts={posts}
        onMarkerClick={handleMarkerClick}
        selectedPost={selectedPost}
      />

      <DiscoveryCardModal
        post={selectedPost}
        currentLocation={currentLocation}
        onClose={handleCloseModal}
      />
    </Box>
  );
}
