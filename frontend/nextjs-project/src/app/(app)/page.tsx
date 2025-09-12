"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";

import dynamic from "next/dynamic";
import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
import { fetchPosts } from "@/libs/fetchPosts";
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

export default function HomePage() {
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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

  // マーカーがクリックされた時の処理
  const handleMarkerClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
  };

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
