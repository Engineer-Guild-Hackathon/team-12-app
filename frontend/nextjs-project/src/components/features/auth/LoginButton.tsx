"use client";

import { Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();

  const handleLogin = async () => {
    console.log("ユーザーが登録済みかサーバーに問い合わせ中");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const isRegistered = Math.random() < 0.5;

    if (isRegistered) {
      console.log("登録済み");
      router.push("/");
    } else {
      console.log("未登録");
      router.push("/signup");
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleLogin}
      sx={{
        width: "100%",
        maxWidth: 340, // 固定幅ではなく最大幅にするのがおすすめ
        borderRadius: 200,
        marginTop: "80px",
        backgroundColor: "yomogi.800",
        color: "gray.100",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        lineHeight: 1.2,
        py: 4,
        gap: 1,
        boxShadow: "none",
        textTransform: "none",
      }}
    >
      <Typography fontSize={20}>はじめる</Typography>
      <Typography fontSize={12}>Googleアカウントで認証する</Typography>
    </Button>
  );
}
