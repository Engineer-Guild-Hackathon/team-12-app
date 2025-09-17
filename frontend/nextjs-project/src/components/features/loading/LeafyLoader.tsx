"use client";

import { Box } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { IoLeaf } from "react-icons/io5";

// 1. @keyframesを定義
const fadeInStay = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.8);
  }
  30%, 70% {
    opacity: 1;
    transform: scale(1);
  }
`;

// 2. スタイルを適用したコンポーネントを作成
const LoaderContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "12px",
});

const LeafIcon = styled(IoLeaf)({
  color: "#322508",
  opacity: 0,
  animationName: fadeInStay,
  animationDuration: "2s",
  animationIterationCount: "infinite",
  animationFillMode: "forwards",
  // :nth-of-typeを使って順番にdelayを適用
  "&:nth-of-type(2)": {
    animationDelay: "0.2s",
  },
  "&:nth-of-type(3)": {
    animationDelay: "0.4s",
  },
});

// 3. 作成したコンポーネントを使ってLeafyLoaderを組み立てる
export default function LeafyLoader() {
  return (
    <LoaderContainer>
      <LeafIcon size={24} />
      <LeafIcon size={24} />
      <LeafIcon size={24} />
    </LoaderContainer>
  );
}
