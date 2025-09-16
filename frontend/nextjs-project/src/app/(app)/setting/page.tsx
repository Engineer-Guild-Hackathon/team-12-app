"use client";

import LoginGuideModal from "@/components/features/auth/LoginGuideModal";
import SubmitButton from "@/components/ui/SubmitButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";
import { useRouter } from "next/navigation";

export default function SettingPage() {
  const { signOut, user } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };
  return (
    <>
      <Stack pt={2}>
        <SubmitButton onClick={handleLogout}>ログアウト</SubmitButton>
      </Stack>
      <LoginGuideModal open={user === null} />
    </>
  );
}
