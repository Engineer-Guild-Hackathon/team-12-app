import { Stack, Typography } from "@mui/material";
import React from "react";
import SectionHeader from "./SectionHeader";

interface SectionProps {
  icon: React.ReactElement;
  title: string;
  children: React.ReactNode;
}

export default function Section({ icon, title, children }: SectionProps) {
  return (
    <Stack spacing={1.5}>
      <SectionHeader icon={icon} title={title} />

      <Typography variant="body1" sx={{ fontSize: 16, px: 1.5 }}>
        {children}
      </Typography>
    </Stack>
  );
}
