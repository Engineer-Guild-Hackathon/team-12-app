"use client";

import { DISCOVERY_HEADER_HEIGHT, MOBILE_MAX_WIDTH } from "@/constants/styles";
import { Box } from "@mui/material";
import React from "react";
import TimestampDisplay from "./TimestampDisplay";
import { MdSunny } from "react-icons/md";
import { RiMoonClearFill } from "react-icons/ri";
import { TbSunset2 } from "react-icons/tb";
import { TimeOfDayIcon } from "@/utils/formatDate";
import BackButton from "./BackButton";

interface DiscoveryHeaderProps {
  iconName: TimeOfDayIcon;
  formattedDate: string;
}

// アイコン名（文字列）を、実際のアイコンコンポーネントに変換するヘルパー
const getIconComponent = (iconName: TimeOfDayIcon) => {
  if (iconName === "sun") return <MdSunny size={20} />;
  if (iconName === "sunset") return <TbSunset2 size={20} />;
  if (iconName === "moon") return <RiMoonClearFill size={20} />;
  return null;
};

export default function DiscoveryHeader({
  iconName,
  formattedDate,
}: DiscoveryHeaderProps) {
  const iconComponent = getIconComponent(iconName);

  return (
    <Box
      sx={{
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
        backgroundColor: "kinako.100",
        color: "kinako.900",
        borderBottom: "1px solid",
        borderColor: "kinako.300",
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          width: "100%",
        }}
      >
        <BackButton sx={{ width: 40, height: 40, color: "kinako.900" }} />

        <TimestampDisplay icon={iconComponent} formattedDate={formattedDate} />

        <Box sx={{ width: 40, height: 40 }} />
      </Box>
    </Box>
  );
}
