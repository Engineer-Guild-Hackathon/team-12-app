"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useMapControl } from "@/hooks/useMapControl";
import { createCustomIcon } from "@/utils/createCustomIcon";
import { Post } from "@/types/post";
import RecenterButton from "./RecenterButton";
import { Box } from "@mui/material";
import { useEffect } from "react";

interface MapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
}

// マップインスタンスを取得するための、目に見えないコンポーネント
function MapController({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}

export default function Map({ posts, onMarkerClick }: MapProps) {
  const { position, setMap, isLoading, handleRecenter } = useMapControl();

  if (isLoading) {
    return <p>現在地を取得しています...</p>;
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
          <Marker
            key={post.post_id}
            position={[post.latitude, post.longitude]}
            icon={createCustomIcon()}
            eventHandlers={{
              click: () => onMarkerClick(post),
            }}
          />
        ))}

        <MapController setMap={setMap} />
        <RecenterButton onClick={handleRecenter} />
      </MapContainer>
    </Box>
  );
}
