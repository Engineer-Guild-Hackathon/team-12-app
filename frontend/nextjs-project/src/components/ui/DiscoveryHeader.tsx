"use client";

import { DISCOVERY_HEADER_HEIGHT, MOBILE_MAX_WIDTH } from "@/constants/styles";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import React from "react";
import TimestampDisplay from "./TimestampDisplay";
import { TimeOfDayIcon } from "@/utils/formatDate";
import BackButton from "./BackButton";
import getIconComponent from "@/utils/getIconComponent";

interface DiscoveryHeaderProps {
  iconName: TimeOfDayIcon;
  formattedDate: string;
  variant?: "default" | "transparent";
  onBackClick?: () => void;
}

export default function DiscoveryHeader({
  iconName,
  formattedDate,
  variant = "default",
  onBackClick,
}: DiscoveryHeaderProps) {
  const iconComponent = getIconComponent(iconName);

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        display: "flex",
        alignItems: "flex-end",
        px: 1,
        py: 2.5,
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: `${DISCOVERY_HEADER_HEIGHT}px`,
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: (theme) => theme.zIndex.appBar,
        ...(variant === "transparent"
          ? {
              // グラデーションをbackgroundに設定
              background: `linear-gradient(to bottom, ${alpha(theme.palette.kinako[900] ?? "#000", 0.5)}, transparent)`,
              borderBottom: "none",
            }
          : {
              backgroundColor: theme.palette.kinako[100],
              borderBottom: `1px solid ${theme.palette.kinako[300]}`,
            }),
      })}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          width: "100%",
        }}
      >
        <BackButton
          sx={{
            width: 40,
            height: 40,
            color: variant === "transparent" ? "white" : "kinako.900",
          }}
          onClick={onBackClick}
        />

        <TimestampDisplay
          icon={iconComponent}
          formattedDate={formattedDate}
          variant={variant}
        />

        <Box sx={{ width: 40, height: 40 }} />
      </Box>
    </Box>
  );
}
