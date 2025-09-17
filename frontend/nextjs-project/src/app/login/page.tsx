"use client";

import LoginView from "@/components/features/auth/LoginView";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  // ログイン済みならマップにリダイレクト
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  useEffect(() => {
    if (user !== null) {
      router.replace("/");
    }
  }, [user, router]);

  return <LoginView />;
}
