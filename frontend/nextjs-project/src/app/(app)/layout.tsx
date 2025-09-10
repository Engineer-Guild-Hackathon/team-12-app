"use client";

import { Box, Typography } from "@mui/material";
import React from "react";
import { HEADER_HEIGHT } from "@/constants/styles";
import Header from "@/components/features/header/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          height: "1500px",
          mt: `${HEADER_HEIGHT}px`,
        }}
      >
        {children}
      </Box>

      {/* フッター */}
      <Box
        component="footer"
        sx={{
          py: 2, // 上下の余白
          px: 2,
          mt: "auto", // フッターを最下部に押し出すための設定
          backgroundColor: "#f5f5f5",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Michikusa. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}
