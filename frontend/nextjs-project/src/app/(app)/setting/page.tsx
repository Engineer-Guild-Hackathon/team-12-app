"use client";

import SubmitButton from "@/components/ui/SubmitButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingPage() {
  const { signOut, user } = useAuthStore((state) => ({
    signOut: state.signOut,
    user: state.user,
  }));
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };

  // 万が一URLに直接アクセスされたときの対策
  useEffect(() => {
    if (user === null) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <Stack pt={2}>
      <SubmitButton onClick={handleLogout}>ログアウト</SubmitButton>
    </Stack>
  );
}
