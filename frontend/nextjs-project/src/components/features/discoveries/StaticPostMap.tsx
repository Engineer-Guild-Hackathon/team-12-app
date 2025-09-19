"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { Post } from "@/types/post";
import { Box } from "@mui/material";
import React, { useEffect } from "react";
import PostMarker from "../map/PostMarker";
import { useRouter } from "next/navigation";
import { useMapStore } from "@/stores/mapStore";

interface StaticPostMapProps {
  post: Post;
}

export default function StaticPostMap({ post }: StaticPostMapProps) {
  const position: [number, number] = [post.latitude, post.longitude];

  const router = useRouter();
  const setInitialTarget = useMapStore((state) => state.setInitialTarget);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // 1. Zustandストアに初期表示したい投稿の情報をセット
    setInitialTarget({
      postId: post.post_id,
      lat: post.latitude,
      lng: post.longitude,
    });

    // 2. プログラムでマップページ（ホームページ）に遷移
    router.push("/");
  };

  useEffect(() => {
    const styleId = "map-marker-styles";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.innerHTML = `
    /* 両方のマーカーに共通の基本スタイル */
    .custom-marker-default,
    .custom-marker-selected,
    .custom-marker-pr-default,
    .custom-marker-pr-selected {
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      border: none;
          background-color: transparent;
    }

    /* 通常時のマーカーアイコン */
    .custom-marker-default {
      background-image: url('/marker.svg');
    }

    /* 選択時のマーカーアイコン */
    .custom-marker-selected {
      background-image: url('/selected-marker.svg');
    }

    /* PR通常時のマーカーアイコン（紫） */
    .custom-marker-pr-default {
      background-image: url('/pr_marker.svg');
    }

    /* PR選択時のマーカーアイコン（紫選択） */
    .custom-marker-pr-selected {
      background-image: url('/pr_selected_marker.svg');
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

  return (
    <Box
      onClick={handleClick}
      sx={{
        height: "300px",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          height: "300px",
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
          // --- すべてのインタラクションを無効化 ---
          dragging={false}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <PostMarker key={post.post_id} post={post} isSelected={true} />
        </MapContainer>
      </Box>
    </Box>
  );
}
