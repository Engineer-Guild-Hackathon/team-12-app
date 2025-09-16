"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { useMapControl } from "@/hooks/useMapControl";
import { Post } from "@/types/post";
import RecenterButton from "./RecenterButton";
import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import PostMarker from "./PostMarker";
import { useGeolocation } from "@/hooks/useGeolocation";
import CurrentUserMarker from "./CurrentUserMarker";
import MapViewController from "./MapViewController";
import MapInitialViewSetter from "./MapInitialViewSetter";

interface MapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
  selectedPost: Post | null;
}

export default function Map({ posts, onMarkerClick, selectedPost }: MapProps) {
  const { latitude, longitude, loading: geolocationLoading } = useGeolocation();
  const { map, setMap, flyTo } = useMapControl();
  const [isFollowing, setIsFollowing] = useState(true);

  const handleRecenter = () => {
    if (latitude && longitude) {
      flyTo([latitude, longitude], 16);
      setIsFollowing(true);
    }
  };

  const handleManualDrag = () => {
    setIsFollowing(false);
  };

  useEffect(() => {
    if (!map) return;
    map.on("dragstart", handleManualDrag);
    return () => {
      map.off("dragstart", handleManualDrag);
    };
  }, [map]);

  // アニメーションとマーカーアイコンのスタイルを<head>に注入します
  useEffect(() => {
    const styleId = "map-marker-styles";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.innerHTML = `
      /* 両方のマーカーに共通の基本スタイル */
      .custom-marker-default,
      .custom-marker-selected {
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: none; /* Leafletのデフォルトの枠線を消す */
      }

      /* 通常時のマーカーアイコン */
      .custom-marker-default {
        background-image: url('/marker.svg');
      }

      /* 選択時のマーカーアイコン */
      .custom-marker-selected {
        background-image: url('/selected-marker.svg');
      }
  `;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  if (geolocationLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const initialPosition: [number, number] = [
    latitude || 43.068,
    longitude || 141.35,
  ];
  const currentPosition: [number, number] | null =
    latitude && longitude ? [latitude, longitude] : null;

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={initialPosition}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={setMap}
        worldCopyJump={true}
        minZoom={3}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapInitialViewSetter position={initialPosition} />
        {currentPosition && (
          <MapViewController
            position={currentPosition}
            isFollowing={isFollowing}
          />
        )}

        {posts.map((post) => (
          <PostMarker
            key={post.post_id}
            post={post}
            isSelected={selectedPost?.post_id === post.post_id}
            onMarkerClick={onMarkerClick}
          />
        ))}

        {currentPosition && <CurrentUserMarker position={currentPosition} />}

        <RecenterButton onClick={handleRecenter} />
      </MapContainer>
    </Box>
  );
}
