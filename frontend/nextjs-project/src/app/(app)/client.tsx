"use client";

import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePosts } from "@/hooks/usePosts";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

import dynamic from "next/dynamic";
import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

interface HomeClientProps {
  initialPosts: Post[];
}

// initialPostsを受け取る
export default function HomeClient({ initialPosts }: HomeClientProps) {
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };
  const searchParams = useSearchParams();
  const currentScope = searchParams.get("scope");

  // 認証情報を取得
  const user = useAuthStore((state) => state.user);

  const { posts: fetchedPosts, isError } = usePosts(
    {
      scope: currentScope,
      userId: user?.uid,
      currentLocation: { latitude, longitude },
    },
    { posts: initialPosts },
  );

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (isError) return <div>データの取得に失敗しました</div>;

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
