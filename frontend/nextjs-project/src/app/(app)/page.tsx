"use client";

import { Box } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function HomePage() {
  // Mapコンポーネントを動的にインポートし、サーバーサイドレンダリングを無効化
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/features/map/Map"), {
        loading: () => <p>地図を読み込んでいます...</p>,
        ssr: false,
      }),
    [],
  );

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Map />
    </Box>
  );
}
