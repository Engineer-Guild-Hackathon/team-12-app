"use client";

import SubmitButton from "@/components/ui/SubmitButton";
import { useAuthStore } from "@/stores/authStore";
import { Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OverlayLoader from "@/components/features/loading/OverlayLoader";
import { downloadRecentPostsJson } from "@/libs/downloadRecentPosts";

export default function SettingClient() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleLogout = async () => {
    await signOut();
    alert("ログアウトしました");
    router.push("/");
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadRecentPostsJson();
    } catch (e) {
      alert("ダウンロードに失敗しました");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
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

  if (!initialized || isDownloading) {
    return <OverlayLoader />;
  }

  return (
    <Stack pt={2} spacing={2}>
      <SubmitButton onClick={handleDownload}>
        投稿一覧をダウンロード
      </SubmitButton>
      <SubmitButton onClick={handleLogout}>ログアウト</SubmitButton>
    </Stack>
  );
}
