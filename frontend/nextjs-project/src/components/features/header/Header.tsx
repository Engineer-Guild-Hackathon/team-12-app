"use client";

import { AppBar } from "@mui/material";
import { MOBILE_MAX_WIDTH, HEADER_HEIGHT } from "@/constants/styles";
import HeaderTop from "./HeaderTop";
import HeaderTabs from "./HeaderTabs";
import { usePathname } from "next/navigation";

type HeaderProps = {
  onFilterClick?: () => void;
};

export default function Header({ onFilterClick }: HeaderProps) {
  const pathname = usePathname();
  const showTabs = pathname === "/" || pathname === "/list";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: `${HEADER_HEIGHT}px`,
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
        gap: "12px",
      }}
    >
      <HeaderTop onFilterClick={onFilterClick}/>
      {showTabs && <HeaderTabs />}
    </AppBar>
  );
}
