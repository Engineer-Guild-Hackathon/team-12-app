"use client";

import { Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { auth } from "@/libs/firebase.client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useCallback, useState } from "react";

export default function LoginButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!auth) return; // 念のため
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      // TODO: ポップアップブロック環境も想定してフォールバック
      await signInWithPopup(auth, provider);
    } finally {
      setBusy(false);
      router.replace("/");
    }
  }, [router]);

  return (
    <Button
      variant="contained"
      onClick={handleLogin}
      disabled={busy}
      sx={{
        width: "100%",
        maxWidth: { xs: 320, sm: 340 }, // 固定幅ではなく最大幅にするのがおすすめ
        borderRadius: 200,
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
        "&:hover": {
          transform: "translateY(-3px) scale(1.02)",
          boxShadow: "none",
        },
      }}
    >
      <Typography fontSize={{ xs: 20, sm: 24 }}>はじめる</Typography>
      <Typography fontSize={{ xs: 12, sm: 14 }}>
        Googleアカウントで認証する
      </Typography>
    </Button>
  );
}
