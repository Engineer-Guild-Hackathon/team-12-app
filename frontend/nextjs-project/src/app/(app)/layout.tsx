"use client";

import { Box } from "@mui/material";
import React from "react";
import { HEADER_HEIGHT } from "@/constants/styles";
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
          height: "1500px",
          mt: `${HEADER_HEIGHT}px`,
        }}
      >
        {children}
      </Box>

      <BottomNav />
    </>
  );
}
