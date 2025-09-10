// src/components/features/footer/BottomNav.tsx

"use client";

import { MOBILE_MAX_WIDTH } from "@/constants/styles";
import { BottomNavigation, Box } from "@mui/material";
import { usePathname } from "next/navigation";
import React from "react";
import NavActionButton from "./NavActionButton";
import RecordButton from "./RecordButton";
import {
  IoLeafOutline,
  IoLeaf,
  IoPersonOutline,
  IoPerson,
} from "react-icons/io5";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <BottomNavigation
        showLabels
        value={pathname} // valueはここで一括管理
        sx={{
          borderTop: "1px solid",
          borderColor: "kinako.300",
          backgroundColor: "kinako.100",
          height: 108,
          px: 3,
        }}
      >
        <NavActionButton
          label="はっけん"
          href="/"
          activeIcon={<IoLeaf size={32} />}
          inactiveIcon={<IoLeafOutline size={32} />}
        />
        <RecordButton />
        <NavActionButton
          label="せってい"
          href="/mypage"
          activeIcon={<IoPerson size={32} />}
          inactiveIcon={<IoPersonOutline size={32} />}
        />
      </BottomNavigation>
    </Box>
  );
}
