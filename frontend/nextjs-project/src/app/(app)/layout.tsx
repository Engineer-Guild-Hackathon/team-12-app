"use client";

import { Box } from "@mui/material";
import React, {useState} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HEADER_HEIGHT, BOTTOM_NAV_HEIGHT } from "@/constants/styles";
import Header from "@/components/features/header/Header";
import BottomNav from "@/components/features/bottom-nav/BottomNav";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import DiscoveryCreationFlow from "@/components/features/discovery-creation/DiscoveryCreationFlow";
import FilterDrawer from "@/components/features/filter/FilterDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const isFilterEnabled = pathname === "/" || pathname === "/list";

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortValue);
    router.push(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

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
      <Header onFilterClick={isFilterEnabled ? () => setIsFilterOpen(true) : undefined} />
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
      {isFilterEnabled && (
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          onOpen={() => setIsFilterOpen(true)}
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      )}
    </>
  );
}
