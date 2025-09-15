"use client";

import { useEffect } from "react";
import { useAuthStore, AuthState } from "@/stores/authStore";

export default function AuthInitializer() {
  const init = useAuthStore((s: AuthState) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return null; // 何も描画しない
}
