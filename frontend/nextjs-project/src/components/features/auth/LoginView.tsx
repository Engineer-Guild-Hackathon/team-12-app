"use client"; // 子にインタラクティブな要素を持つため

import { Box, Typography } from "@mui/material";
import Image from "next/image";
import logo from "../../../../public/logo.svg"; // パスを調整
import LoginButton from "./LoginButton"; // ボタンコンポーネントをインポート

export default function LoginView() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100svh",
        paddingTop: "240px",
        px: "12%",
      }}
    >
      <Box sx={{ mb: "24px" }}>
        <Image src={logo} alt="Logo" width={200} height={113} />
      </Box>
      <Typography
        variant="h3"
        sx={{
          fontSize: 20,
          color: "kinako.800",
          mt: 2,
          textAlign: "center",
          lineHeight: 1.8,
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
      <LoginButton />
    </Box>
  );
}
