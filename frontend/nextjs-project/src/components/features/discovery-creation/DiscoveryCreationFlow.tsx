"use client";

import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import { Box, Typography, Button } from "@mui/material";
import ShootingStep from "./ShootingStep"; // 更新した撮影ステップ
import DiscoveryImage from "@/components/ui/DiscoveryImage";

// コメント入力と確認ステップ（仮）
const CommentingStep = ({
  onNext,
  onPrev,
  photo,
}: {
  onNext: () => void;
  onPrev: () => void;
  photo: string | null;
}) => (
  <Box
    sx={{
      p: 2,
      backgroundColor: "lightgreen",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}
  >
    <Button onClick={onPrev} variant="outlined">
      戻る
    </Button>
    <Typography>2. コメント入力画面</Typography>
    {photo && <DiscoveryImage src={photo} alt="撮影した写真" />}
    <Button onClick={onNext} variant="contained">
      送信（次へ）
    </Button>
  </Box>
);
const ReviewingStep = ({
  onPrev,
  onCancel,
}: {
  onPrev: () => void;
  onCancel: () => void;
}) => (
  <Box
    sx={{
      p: 2,
      backgroundColor: "lightcoral",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 2,
    }}
  >
    <Button onClick={onPrev} variant="outlined">
      戻る
    </Button>
    <Button onClick={onCancel} variant="outlined">
      保存する
    </Button>
  </Box>
);

export default function DiscoveryCreationFlow() {
  const {
    currentStep,
    nextStep,
    prevStep,
    cancelCreation,
    photoData,
    setPhotoData,
  } = useDiscoveryCreationStore();

  const handlePhotoTaken = (photo: string) => {
    setPhotoData(photo); // 撮影された写真をストアに保存
    nextStep(); // 次のステップへ
  };

  switch (currentStep) {
    case "shooting":
      return (
        <ShootingStep onNext={handlePhotoTaken} onCancel={cancelCreation} />
      );
    case "commenting":
      return (
        <CommentingStep onNext={nextStep} onPrev={prevStep} photo={photoData} />
      );
    case "reviewing":
      return <ReviewingStep onPrev={prevStep} onCancel={cancelCreation} />;
    default:
      return null;
  }
}
