import { Suspense } from "react";
import { Box } from "@mui/material";
import HomeClient from "./client";
import LeafyLoader from "@/components/features/loading/LeafyLoader";

// Suspenseのローディング中に表示するコンポーネント
function HomeLoading() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center", // 横方向の中央揃え
        alignItems: "center", // 縦方向の中央揃え
        height: "100%", // 親要素の高さ全体を使う
        width: "100%", // 親要素の幅全体を使う
      }}
    >
      <LeafyLoader />
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
