"use client";

import SubmitButton from "@/components/ui/SubmitButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import OverlayLoader from "@/components/features/loading/OverlayLoader";

export default function SettingPage() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };

  // 万が一URLに直接アクセスされたときの対策
  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (user === null) {
      router.replace("/");
    }
  }, [user, initialized, router]);

  if (!initialized) {
    return <OverlayLoader />;
  }

  return (
    <Stack pt={2}>
      <SubmitButton onClick={handleLogout}>ログアウト</SubmitButton>
    </Stack>
  );
}
