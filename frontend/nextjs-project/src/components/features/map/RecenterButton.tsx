"use client";

import { Box, IconButton } from "@mui/material";
import { MdMyLocation } from "react-icons/md";

interface RecenterButtonProps {
  onClick: () => void;
}

export default function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 36,
        right: 24,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {/* 内側のボタン：クリックイベントを「有効」に戻す */}
      <IconButton
        onClick={onClick}
        size="large"
        sx={{
          pointerEvents: "auto",
          backgroundColor: "white",
          color: "kinako.900",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          "&:hover": {
            backgroundColor: "gray.100",
          },
        }}
        aria-label="現在地に戻る"
      >
        <MdMyLocation size={26} />
      </IconButton>
    </Box>
  );
}
