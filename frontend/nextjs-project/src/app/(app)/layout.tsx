"use client";

import { Box } from "@mui/material";
import React, { Suspense } from "react"; // Suspenseをインポート
import FilterHandler from "@/components/features/filter/FilterHandler"; // 作成したコンポーネントをインポート
import {
  HEADER_HEIGHT,
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_HEIGHT_FOR_BROWSER,
  HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import Header from "@/components/features/header/Header";
import BottomNav from "@/components/features/bottom-nav/BottomNav";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import DiscoveryCreationFlow from "@/components/features/discovery-creation/DiscoveryCreationFlow";
import { useIsPWA } from "@/hooks/useIsPWA";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const currentStep = useDiscoveryCreationStore((state) => state.currentStep);
  const isPWA = useIsPWA();
  const headerHeight = isPWA ? HEADER_HEIGHT : HEADER_HEIGHT_FOR_BROWSER;
  const bottomNavHeight = isPWA
    ? BOTTOM_NAV_HEIGHT
    : BOTTOM_NAV_HEIGHT_FOR_BROWSER;

  if (currentStep) {
    return (
      <Box
        component="main"
        sx={{
          width: "100%",
          height: "100%",
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
          height: "100svh",
          overflowY: "hidden",
          paddingTop: `${headerHeight}px`,
          paddingBottom: `${bottomNavHeight}px`,
        }}
      >
        {children}
      </Box>

      <BottomNav />
    </>
  );
}
