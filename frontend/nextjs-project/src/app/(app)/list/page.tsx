import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import ListClient from "./client";

// Suspenseのローディング中に表示するコンポーネント
function ListLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<ListLoading />}>
      <ListClient />
    </Suspense>
  );
}
