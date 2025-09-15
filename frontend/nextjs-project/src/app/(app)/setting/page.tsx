"use client";

import LogoutButton from "@/components/features/auth/LogoutButton";
import { Stack } from "@mui/material";

export default function SettingPage() {
  return (
    <Stack pt={2}>
      <LogoutButton />
    </Stack>
  );
}
