import { Box } from "@mui/material";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート

export default function Loading() {
  // サーバーのローディング画面として、作成したアニメーションを表示
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
