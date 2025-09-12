"use client";

import { Box } from "@mui/material";
import React, { Suspense } from "react"; // Suspenseをインポート
import { HEADER_HEIGHT, BOTTOM_NAV_HEIGHT } from "@/constants/styles";
import BottomNav from "@/components/features/bottom-nav/BottomNav";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import DiscoveryCreationFlow from "@/components/features/discovery-creation/DiscoveryCreationFlow";
import FilterHandler from "@/components/features/filter/FilterHandler"; // 作成したコンポーネントをインポート


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentStep = useDiscoveryCreationStore((state) => state.currentStep);
 

  if (currentStep) {
    return (
      <Box
        component="main"
        sx={{
          width: "100%",
          height: "100vh",
          overflowY: "hidden",
        }}
      >
        <DiscoveryCreationFlow />
      </Box>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <FilterHandler />
      </Suspense>

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
