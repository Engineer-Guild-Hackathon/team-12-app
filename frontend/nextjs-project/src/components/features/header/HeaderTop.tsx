"use client";

import { Box, IconButton, SvgIcon, Typography } from "@mui/material";
import Link from "next/link";
import { IoLeaf, IoFilterOutline } from "react-icons/io5";
import { HEADER_HEIGHT, HEADER_HEIGHT_FOR_BROWSER } from "@/constants/styles";
import { useIsPWA } from "@/hooks/useIsPWA";

type HeaderTopProps = {
  onFilterClick?: () => void;
  title?: string;
  icon?: React.ReactNode;
};

export default function HeaderTop({
  onFilterClick,
  title = "はっけん",
  icon = <IoLeaf />,
}: HeaderTopProps) {
  const isPWA = useIsPWA();
  const headerHeight = isPWA ? HEADER_HEIGHT : HEADER_HEIGHT_FOR_BROWSER;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        height: `${headerHeight - 48}px`,
        alignItems: "center",
      }}
    >
      {onFilterClick && <Box sx={{ width: 40 }} />}

      {/* 中央のロゴとタイトル */}
      <Box
        component={Link}
        href="/"
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <SvgIcon sx={{ mr: 1.5 }}>{icon}</SvgIcon>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>

      {/* 右側のフィルターアイコン */}
      {onFilterClick && (
        <IconButton
          color="inherit"
          onClick={onFilterClick}
          sx={{ width: 40, height: 40, borderRadius: "50%" }}
        >
          <SvgIcon>
            <IoFilterOutline />
          </SvgIcon>
        </IconButton>
      )}
    </Box>
  );
}
