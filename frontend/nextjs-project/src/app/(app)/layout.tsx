"use client";

import { Box } from "@mui/material";
import React from "react";
import { HEADER_HEIGHT, BOTTOM_NAV_HEIGHT } from "@/constants/styles";
import Header from "@/components/features/header/Header";
import BottomNav from "@/components/features/bottomNav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          width: "100%",
          height: "100vh",
          overflowY: "hidden",
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${BOTTOM_NAV_HEIGHT}px`,
        }}
      >
        {children}
      </Box>

      <BottomNav />
    </>
  );
}
