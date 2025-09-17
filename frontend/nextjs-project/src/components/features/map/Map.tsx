"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useMapControl } from "@/hooks/useMapControl";
import { Post } from "@/types/post";
import RecenterButton from "./RecenterButton";
import { Box } from "@mui/material";
import { useEffect } from "react";
import PostMarker from "./PostMarker";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート

interface MapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
  selectedPost: Post | null;
}

// マップインスタンスを取得するための、目に見えないコンポーネント
function MapController({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}

export default function Map({ posts, onMarkerClick, selectedPost }: MapProps) {
  const { position, setMap, isLoading, handleRecenter } = useMapControl();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center", // 横方向の中央揃え
          alignItems: "center", // 縦方向の中央揃え
          height: "100%", // 親要素の高さ全体を使う
          width: "100%", // 親要素の幅全体を使う
        }}
      >
        <LeafyLoader />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <style>{`.custom-marker-icon { background: none; border: none; }`}</style>
      <MapContainer
        center={position}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {posts.map((post) => (
          <PostMarker
            key={post.post_id}
            post={post}
            isSelected={selectedPost?.post_id === post.post_id}
            onMarkerClick={onMarkerClick}
          />
        ))}

        <MapController setMap={setMap} />
        <RecenterButton onClick={handleRecenter} />
      </MapContainer>
    </Box>
  );
}
