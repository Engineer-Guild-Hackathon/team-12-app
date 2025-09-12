"use client";

import { Box, Stack, Typography } from "@mui/material";
import React from "react";

interface TimestampDisplayProps {
  icon: React.ReactNode;
  formattedDate: string;
  variant?: "default" | "transparent" | "small";
}

export default function TimestampDisplay({
  icon,
  formattedDate,
  variant = "default",
}: TimestampDisplayProps) {
  let textColor = "kinako.900";
  let iconColor = "tamago.600";
  let fontSize = 20;
  let flexGrow = 1;

  if (variant === "transparent") {
    textColor = "white";
    iconColor = "white";
  }
  if (variant === "small") {
    fontSize = 18;
    flexGrow = 0;
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{
        flexGrow: flexGrow,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: fontSize,
          lineHeight: 1,
          color: textColor,
        }}
      >
        {formattedDate}
      </Typography>
      <Box component="span" sx={{ color: iconColor, display: "flex" }}>
        {icon}
      </Box>
    </Stack>
  );
}
