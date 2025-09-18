"use client";

import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import ShootingStep from "./ShootingStep";
import CommentingStep from "./CommentingStep";
import ReviewingStep from "./ReviewingStep";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function DiscoveryCreationFlow() {
  const {
    currentStep,
    nextStep,
    prevStep,
    cancelCreation,
    photoData,
    setPhotoData,
    setUserQuestion,
    setLocation,
    generateAiResponse,
    isGenerating,
  } = useDiscoveryCreationStore();
  const { latitude, longitude } = useGeolocation();

  const handlePhotoTaken = (photo: string) => {
    setPhotoData(photo);
    nextStep();
  };

  const handleCommentSubmitUserQuestion = async (user_question: string) => {
    setUserQuestion(user_question);
    // 現在の推定位置があればストアに反映（AIプロンプトの文脈用）
    setLocation(latitude, longitude);
    await generateAiResponse(); // AIの回答生成を待つ
    nextStep();
  };

  switch (currentStep) {
    case "shooting":
      return (
        <ShootingStep onNext={handlePhotoTaken} onCancel={cancelCreation} />
      );

    case "commenting":
      return (
        <CommentingStep
          photo={photoData}
          isGenerating={isGenerating}
          onNext={handleCommentSubmitUserQuestion}
          onPrev={prevStep}
        />
      );

    case "reviewing":
      return <ReviewingStep />;
    default:
      return null;
  }
}
