"use client";

import AuthButton from "@/components/features/auth/AuthButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";
import { useRouter } from "next/navigation";

export default function SettingPage() {
  const { signOut } = useAuthStore();
  const router = useRouter();
  const handleLogin = () => {
    router.push("/login");
  };
  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };

  return (
    <Stack spacing={2} pt={2}>
      <AuthButton text="ログイン" onClick={handleLogin} />
      <AuthButton text="ログアウト" onClick={handleLogout} />
    </Stack>
  );
}
