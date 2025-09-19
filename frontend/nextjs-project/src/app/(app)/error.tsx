"use client";

import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%", // 画面の高さに応じて中央に配置
        textAlign: "center",
        p: 3,
      }}
    >
      {/* ★★★ ここで受け取ったエラーメッセージを表示 ★★★ */}
      <Typography sx={{ color: "#322508" }}>
        ※{error.message || "不明なエラーが発生しました"}
      </Typography>

      <Button
        variant="outlined"
        onClick={() => router.back()}
        sx={{
          mt: 3,
          px: 6,
          py: 2,
          color: "gray.100",
          borderColor: "yomogi.800",
          backgroundColor: "yomogi.800",
          borderRadius: 100,
        }}
      >
        前のページへ戻る
      </Button>
    </Box>
  );
}
