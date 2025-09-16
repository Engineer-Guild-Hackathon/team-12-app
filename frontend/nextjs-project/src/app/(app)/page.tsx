"use client";

import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePosts } from "@/hooks/usePosts";
import { useFilterStore } from "@/stores/filterStore";
import { useSearchParams } from "next/navigation";

import dynamic from "next/dynamic";
import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

export default function HomePage() {
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };
  const searchParams = useSearchParams();
  const currentScope = searchParams.get("scope");

  // TODO: 認証情報を取得
  const user = {};

  const {
    posts: fetchedPosts,
    isLoading,
    isError,
  } = usePosts({
    scope: currentScope,
    userId: user?.uid,
    currentLocation: { latitude, longitude },
  });

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // マーカーがクリックされた時の処理
  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

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
