import { Suspense } from "react";
import { Box } from "@mui/material";
import HomeClient from "./client";

// Suspenseのローディング中に表示するコンポーネント
function HomeLoading() {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div>地図の準備をしています...</div>
    </Box>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeClient />
    </Suspense>
  );
}
