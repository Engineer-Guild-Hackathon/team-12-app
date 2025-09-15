"use client";

import { Button } from "@mui/material";

export default function AuthButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      sx={{
        backgroundColor: "kinako.900",
        color: "white",
        "&:hover": {
          backgroundColor: "kinako.700",
        },
        padding: "8px 16px",
        height: "56px",
        width: "80%",
        borderRadius: "200px",
        textTransform: "none",
        fontSize: "20px",
        alignSelf: "center",
      }}
    >
      {text}
    </Button>
  );
}
