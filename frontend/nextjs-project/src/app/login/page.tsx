"use client";

import LoginView from "@/components/features/auth/LoginView";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import OverlayLoader from "@/components/features/loading/OverlayLoader";

export default function LoginPage() {
  // ログイン済みならマップにリダイレクト
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const router = useRouter();
  useEffect(() => {
    if (!initialized) {
      return;
    }
    if (user !== null) {
      router.replace("/");
    }
  }, [user, initialized, router]);

  if (!initialized) {
    return <OverlayLoader />;
  }

  return <LoginView />;
}
