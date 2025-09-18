import { Box, Typography } from "@mui/material";
import LeafyLoader from "./LeafyLoader";
import { MOBILE_MAX_WIDTH } from "@/constants/styles";

// messageプロパティを受け取れるように型を定義
interface FullScreenLoaderProps {
  message?: string;
}

export default function FullScreenLoader({ message }: FullScreenLoaderProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "kinako.100",
        zIndex: 9999,
        // アイコンとテキストを縦に並べるために追加
        flexDirection: "column",
      }}
    >
      {/* messageがあれば、アイコンの下に表示する */}
      {message && (
        <Typography sx={{ mb: 2, color: "kinako.800" }}>{message}</Typography>
      )}
      <LeafyLoader />
    </Box>
  );
}
