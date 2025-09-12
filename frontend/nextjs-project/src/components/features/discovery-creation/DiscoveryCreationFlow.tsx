"use client";

import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import ShootingStep from "./ShootingStep";
import CommentingStep from "./CommentingStep";
import ReviewingStep from "./ReviewingStep";

export default function DiscoveryCreationFlow() {
  const {
    currentStep,
    nextStep,
    prevStep,
    cancelCreation,
    photoData,
    setPhotoData,
    setQuestion,
    generateAiResponse,
    isGenerating,
  } = useDiscoveryCreationStore();

  const handlePhotoTaken = (photo: string) => {
    setPhotoData(photo);
    nextStep();
  };

  const handleCommentSubmit = async (question: string) => {
    setQuestion(question);
    await generateAiResponse(); // AIの応答生成を待つ
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
          onNext={handleCommentSubmit}
          onPrev={prevStep}
        />
      );

    case "reviewing":
      return <ReviewingStep />;
    default:
      return null;
  }
}
