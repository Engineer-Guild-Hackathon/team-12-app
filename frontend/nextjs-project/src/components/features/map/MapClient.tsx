"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { fetcher } from "@/libs/fetcher";

import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";

// Mapコンポーネントはクライアントサイドでのみ動作するため、動的インポートを継続
const Map = dynamic(() => import("@/components/features/map/Map"), {
  ssr: false,
});

type PostsApiResponse = {
  posts: Post[];
};

// サーバーから初期データを受け取るためのProps
interface MapClientProps {
  initialPosts: Post[];
}

export default function MapClient({ initialPosts }: MapClientProps) {
  // 位置情報の取得はクライアントでのみ可能
  const { latitude, longitude } = useGeolocation();
  const currentLocation = { latitude, longitude };

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // SWRを使ってクライアントサイドでのデータ再検証も可能にする
  const { data } = useSWR<PostsApiResponse>(
    "/api/posts?limit=100&offset=0",
    fetcher,
    {
      fallbackData: { posts: initialPosts }, // サーバーからのデータを初期値に設定
      refreshInterval: 300000, // 5分ごとに自動更新
    },
  );

  const posts = data?.posts || [];

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
