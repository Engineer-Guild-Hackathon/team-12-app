"use client"; // 子にインタラクティブな要素を持つため

import { Box, Stack, Typography } from "@mui/material";
import Image from "next/image";
import logo from "../../../../public/logo.png"; // パスを調整
import LoginButton from "./LoginButton"; // ボタンコンポーネントをインポート
import Link from "next/link";

export default function LoginView() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100svh",
        height: "100svh",
        justifyContent: "space-evenly",
        py: 10,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Image src={logo} alt="Logo" width={180} />
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: 18, sm: 20 },
            color: "kinako.800",
            textAlign: "center",
            lineHeight: { xs: 1.6, sm: 1.8 },
          }}
        >
          道端に光る「どうして？」を
          <br />
          見つけにいこう。
          <br />
          AIカメラと問いで作る
          <br />
          新しい散歩地図。
        </Typography>
      </Stack>
      <Stack spacing={2} sx={{ alignItems: "center", width: "100%" }}>
        <LoginButton />
        <Link href="/">
          <Typography
            variant="body2"
            sx={{
              color: "kinako.800",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            ログインせずに使う
          </Typography>
        </Link>
      </Stack>
    </Box>
  );
}
