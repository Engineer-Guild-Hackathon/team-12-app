// src/components/features/footer/BottomNav.tsx

"use client";

import {
  MOBILE_MAX_WIDTH,
  BOTTOM_NAV_HEIGHT,
  BOTTOM_NAV_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
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
  IoLogInOutline,
  IoLogIn,
} from "react-icons/io5";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useAuthStore } from "@/stores/authStore";

export default function BottomNav() {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const isPWA = useIsPWA();
  const bottomNavHeight = isPWA
    ? BOTTOM_NAV_HEIGHT
    : BOTTOM_NAV_HEIGHT_FOR_BROWSER;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <BottomNavigation
        showLabels
        value={pathname} // valueはここで一括管理
        sx={{
          borderTop: "1px solid",
          borderColor: "kinako.300",
          backgroundColor: "kinako.100",
          height: `${bottomNavHeight}px`,
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
        {user === null ? (
          <NavActionButton
            label="ログイン"
            href="/login"
            activeIcon={<IoLogIn size={32} />}
            inactiveIcon={<IoLogInOutline size={32} />}
          />
        ) : (
          <NavActionButton
            label="せってい"
            href="/setting"
            activeIcon={<IoPerson size={32} />}
            inactiveIcon={<IoPersonOutline size={32} />}
          />
        )}
      </BottomNavigation>
    </Box>
  );
}
