"use client";

import { Box, Button, Typography } from "@mui/material";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh", // 画面の高さに応じて中央に配置
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
        onClick={() => reset()}
        sx={{
          mt: 3,
          color: "gray.100",
          borderColor: "yomogi.800",
          backgroundColor: "yomogi.800",
        }}
      >
        再試行
      </Button>
    </Box>
  );
}
