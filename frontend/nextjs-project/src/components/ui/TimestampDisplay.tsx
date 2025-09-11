import { Stack, Typography } from "@mui/material";
import React from "react";

interface TimestampDisplayProps {
  icon: React.ReactNode;
  formattedDate: string;
}

export default function TimestampDisplay({
  icon,
  formattedDate,
}: TimestampDisplayProps) {
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
      <Typography variant="body2" sx={{ fontSize: 20, color: "kinako.900" }}>
        {formattedDate}
      </Typography>
      {icon}
    </Stack>
  );
}
