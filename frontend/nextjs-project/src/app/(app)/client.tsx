"use client";

import { useState, useCallback } from "react";
import { Box } from "@mui/material";
import { Post } from "@/types/post";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePosts } from "@/hooks/usePosts";
import { useSearchParams } from "next/navigation";
import { SearchBarOnMap } from "@/components/features/search/SearchBar";
import { useMapStore } from "@/stores/mapStore";

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

  // TODO: 認証情報を取得
  const user = { uid: "123e4567-e89b-12d3-a456-426614174000" };

  const [searchQuery, setSearchQuery] = useState("");

  const { posts: fetchedPosts, isError } = usePosts(
    {
      scope: currentScope,
      userId: user?.uid,
      currentLocation: { latitude, longitude },
      query: searchQuery,
    },
    { posts: initialPosts },
  );

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFollowing, setIsFollowing] = useState(() => {
    // コンポーネントの初期化時に一度だけZustandストアを直接参照
    const savedMapView = useMapStore.getState().mapView;
    // 保存されたビューがあれば追従OFF(false)、なければ追従ON(true)で開始
    return savedMapView ? false : true;
  });

  const handleMarkerClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setIsFollowing(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    // 何か選択されていたら解除
    setSelectedPost(null);
    // 追従を一旦OFFに（検索結果に視線を移すため。移動制御は別途）
    setIsFollowing(false);
  }, []);

  const handleQueryChange = useCallback((q: string) => {
    // 空文字を自動検知してリセット
    if (q.trim() === "") {
      setSearchQuery("");
    }
  }, []);

  if (isError) return <div>データの取得に失敗しました</div>;

  const posts = fetchedPosts ?? [];

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <SearchBarOnMap
        onSearch={handleSearch}
        onQueryChange={handleQueryChange}
      />
      <Map
        posts={posts}
        onMarkerClick={handleMarkerClick}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
      />

      <DiscoveryCardModal
        post={selectedPost}
        currentLocation={currentLocation}
        onClose={handleCloseModal}
      />
    </Box>
  );
}
