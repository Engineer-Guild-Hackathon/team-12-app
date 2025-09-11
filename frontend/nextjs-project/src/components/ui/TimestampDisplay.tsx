import { Stack, Typography } from "@mui/material";
import React from "react";

interface TimestampDisplayProps {
  icon: React.ReactNode;
  formattedDate: string;
  variant?: "default" | "transparent";
}

export default function TimestampDisplay({
  icon,
  formattedDate,
  variant = "default",
}: TimestampDisplayProps) {
  const textStyles =
    variant === "transparent"
      ? {
          color: "white",
        }
      : {
          color: "kinako.900",
        };

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{
        flexGrow: 1,
        color: "tamago.600",
      }}
    >
      <Typography
        variant="body2"
        sx={{ fontSize: 20, lineHeight: 1, ...textStyles }}
      >
        {formattedDate}
      </Typography>
      {icon}
    </Stack>
  );
}
