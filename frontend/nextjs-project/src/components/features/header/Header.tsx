"use client";

import { AppBar } from "@mui/material";
import {
  MOBILE_MAX_WIDTH,
  HEADER_HEIGHT,
  HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import HeaderTop from "./HeaderTop";
import HeaderTabs from "./HeaderTabs";
import { usePathname } from "next/navigation";
import { useIsPWA } from "@/hooks/useIsPWA";
import { IoPerson } from "react-icons/io5";

type HeaderProps = {
  onFilterClick?: () => void;
};

export default function Header({ onFilterClick }: HeaderProps) {
  const pathname = usePathname();
  const showTabs = pathname === "/" || pathname === "/list";
  const isPWA = useIsPWA();
  let headerHeight = isPWA ? HEADER_HEIGHT : HEADER_HEIGHT_FOR_BROWSER;
  if (pathname === "/setting") {
    headerHeight -= 48;
  }

  let headerTitle: string;
  let headerIcon: React.ReactNode;

  if (pathname === "/setting") {
    headerTitle = "せってい";
    headerIcon = <IoPerson />;
  } else {
    headerTitle = "はっけん";
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: `${headerHeight}px`,
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "kinako.100",
        color: "kinako.900",
        borderBottom: "1px solid",
        borderColor: "kinako.300",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <HeaderTop
        onFilterClick={onFilterClick}
        title={headerTitle}
        icon={headerIcon}
      />
      {showTabs && <HeaderTabs />}
    </AppBar>
  );
}
