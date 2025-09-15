"use client";

import LoginGuideModal from "@/components/features/auth/LoginGuideModal";
import LogoutButton from "@/components/features/auth/LogoutButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";

export default function SettingPage() {
  const { user } = useAuthStore();
  return (
    <>
      <Stack pt={2}>
        <LogoutButton />
      </Stack>
      <LoginGuideModal open={user === null} />
    </>
  );
}
