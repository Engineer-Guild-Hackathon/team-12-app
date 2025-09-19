"use client";

import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePosts } from "@/hooks/usePosts";
import { useSearchParams } from "next/navigation";
import { useMapStore } from "@/stores/mapStore";
import { useHomeSearchBar } from "@/hooks/useSearchBar";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

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

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFollowing, setIsFollowing] = useState(() => {
    // コンポーネントの初期化時に一度だけZustandストアを直接参照
    const savedMapView = useMapStore.getState().mapView;
    // 保存されたビューがあれば追従OFF(false)、なければ追従ON(true)で開始
    return savedMapView ? false : true;
  });
  const { searchQuery, handleSearch, handleQueryChange } = useHomeSearchBar({
    setSelectedPost,
    setIsFollowing,
  });

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setIsFollowing(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const { posts: fetchedPosts, isError } = usePosts(
    {
      scope: currentScope,
      userId: user?.uid,
      currentLocation: { latitude, longitude },
      query: searchQuery,
    },
    { posts: initialPosts },
  );
  const posts = fetchedPosts || [];

  useEffect(() => {
    // isErrorフラグがtrueになった場合
    if (isError) {
      throw new Error("投稿データの取得に失敗しました。");
    }
  }, [isError]); // 監視対象の変数を設定

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <Map
        posts={posts}
        onMarkerClick={handleMarkerClick}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
        initialQuery={searchQuery}
        onSearch={handleSearch}
        onQueryChange={handleQueryChange}
      />

      <DiscoveryCardModal
        post={selectedPost}
        currentLocation={currentLocation}
        onClose={handleCloseModal}
      />
    </Box>
  );
}
