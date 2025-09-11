import { Stack, Typography } from "@mui/material";
import React from "react";

interface SectionHeaderProps {
  icon: React.ReactElement;
  title: string;
}

export default function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ color: "yomogi.800" }}
    >
      {icon}
      <Typography
        variant="h6"
        component="div"
        sx={{ fontSize: 24, color: "kinako.900" }}
      >
        {title}
      </Typography>
    </Stack>
  );
}
