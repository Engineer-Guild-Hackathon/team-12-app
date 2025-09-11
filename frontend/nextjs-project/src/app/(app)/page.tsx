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
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      {/* このBoxが地図コンテナの親となり、高さを決定する */}
      <Box sx={{ height: "calc(100vh - 172px)", width: "100%" }}>
        {/* 172px = ヘッダー(64px) + フッター(108px) の高さ */}
        <Map />
      </Box>

      {/* 必要であれば、地図の上にUIを重ねて表示することも可能 */}
      {/* <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        <Typography>地図上のUI</Typography>
      </Box> */}
    </Box>
  );
}
