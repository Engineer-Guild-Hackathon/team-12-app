"use client";

import {
  DISCOVERY_HEADER_HEIGHT,
  MOBILE_MAX_WIDTH,
  DISCOVERY_HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import React from "react";
import { PiTrash, PiLockKeyFill } from "react-icons/pi";
import TimestampDisplay from "./TimestampDisplay";
import { TimeOfDayIcon } from "@/utils/formatDate";
import BackButton from "./BackButton";
import getIconComponent from "@/utils/getIconComponent";
import { useIsPWA } from "@/hooks/useIsPWA";

interface DiscoveryHeaderProps {
  iconName: TimeOfDayIcon;
  formattedDate: string;
  variant?: "default" | "transparent";
  isShownDeleteButton?: boolean;
  isShownPrivateIcon?: boolean;
  onBackClick?: () => void;
  onDeleteClick?: () => void;
}

export default function DiscoveryHeader({
  iconName,
  formattedDate,
  variant = "default",
  isShownDeleteButton = false,
  isShownPrivateIcon = false,
  onBackClick,
  onDeleteClick,
}: DiscoveryHeaderProps) {
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;
  const pyStyle = isPWA ? 2.5 : 1;

  const iconComponent = getIconComponent(iconName);

  return (
    <Box
      sx={(theme) => ({
        position: "fixed",
        display: "flex",
        alignItems: "flex-end",
        px: 1,
        py: pyStyle,
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: `${discoveryHeaderHeight}px`,
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
        <Box sx={{ width: 80, height: 40 }}>
          <BackButton
            sx={{
              width: 40,
              height: 40,
              color: variant === "transparent" ? "white" : "kinako.900",
            }}
            onClick={onBackClick}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <TimestampDisplay
            icon={iconComponent}
            formattedDate={formattedDate}
            variant={variant}
          />
        </Box>

        <Box
          sx={{
            width: 80,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.5,
          }}
        >
          {isShownPrivateIcon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: variant === "transparent" ? "white" : "kinako.900",
                fontSize: 16,
              }}
            >
              <PiLockKeyFill size={24} />
            </Box>
          )}
          {isShownDeleteButton ? (
            <IconButton
              onClick={onDeleteClick}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                color: variant === "transparent" ? "white" : "kinako.900",
              }}
            >
              <PiTrash />
            </IconButton>
          ) : (
            !isShownPrivateIcon && (
              // デザインの配置の都合上空箱設置（isPublicでない場合のみ）
              <Box sx={{ width: 40, height: 40 }} />
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
