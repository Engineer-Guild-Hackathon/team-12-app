// "use client";

// import { useState } from "react";
// import { Box } from "@mui/material";
// import { Post } from "@/types/post";
// import { useGeolocation } from "@/hooks/useGeolocation";
// import { usePosts } from "@/hooks/usePosts";

// import dynamic from "next/dynamic";
// import DiscoveryCardModal from "@/components/features/map/DiscoveryCardModal";
// const Map = dynamic(() => import("@/components/features/map/Map"), {
//   ssr: false,
// });

// export default function HomePage() {
//   const { latitude, longitude } = useGeolocation();
//   const currentLocation = { latitude, longitude };

//   const { posts: fetchedPosts, isLoading, isError } = usePosts();
//   const [selectedPost, setSelectedPost] = useState<Post | null>(null);

//   // マーカーがクリックされた時の処理
//   const handleMarkerClick = (post: Post) => {
//     setSelectedPost(post);
//   };

//   const handleCloseModal = () => {
//     setSelectedPost(null);
//   };

//   if (isError) return <div>データの取得に失敗しました</div>;

//   if (isLoading) {
//     return (
//       <Box
//         sx={{
//           height: "100%",
//           width: "100%",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <div>地図データを読み込んでいます...</div>
//       </Box>
//     );
//   }

//   const posts = fetchedPosts || [];

//   return (
//     <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
//       <Map
//         posts={posts}
//         onMarkerClick={handleMarkerClick}
//         selectedPost={selectedPost}
//       />

//       <DiscoveryCardModal
//         post={selectedPost}
//         currentLocation={currentLocation}
//         onClose={handleCloseModal}
//       />
//     </Box>
//   );
// }

import MapClient from "@/components/features/map/MapClient";
import { Post } from "@/types/post";
import { Suspense } from "react";

function MapSkeleton() {
  return <div>地図を読み込んでいます...</div>;
}

// ページコンポーネントをasyncにする
export default async function HomePage() {
  // --- ここに直接データ取得ロジックを記述 ---
  const key = "/api/posts?limit=100&offset=0";
  const url = `${process.env.NEXT_PUBLIC_API_URL}${key}`;
  let posts: Post[] = [];

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to fetch posts from server");
    }
    const data = await res.json();
    posts = data.posts;
  } catch (error) {
    console.error(error);
    // エラー時は空のpostsを渡してページを表示
  }
  // ------------------------------------

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapClient initialPosts={posts} />
    </Suspense>
  );
}
