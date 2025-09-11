"use client";

import { Fab } from "@mui/material";
import { MdMyLocation } from "react-icons/md";

interface RecenterButtonProps {
  onClick: () => void;
}

export default function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <Fab
      size="large"
      onClick={onClick}
      sx={{
        position: "absolute",
        bottom: 36,
        right: 24,
        zIndex: 1000,
        backgroundColor: "gray.100",
        color: "kinako.900",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
        "&:focus": {
          backgroundColor: "gray.100",
        },
      }}
    >
      <MdMyLocation size={26} />
    </Fab>
  );
}
