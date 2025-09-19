"use client";

import LoginView from "@/components/features/auth/LoginView";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import OverlayLoader from "@/components/features/loading/OverlayLoader";

export default function LoginClient() {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();

  useEffect(() => {
    // 認証済みになったらトップページへリダイレクト
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // 状態が「未認証」で確定するまでは、問答無用ですべてローディング画面
  if (status !== "unauthenticated") {
    return <OverlayLoader />;
  }
  return <LoginView />;
}
