"use client";

import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import ShootingStep from "./ShootingStep";
import CommentingStep from "./CommentingStep";
import ReviewingStep from "./ReviewingStep";
import { useAuthStore } from "@/stores/authStore";
import LoginGuideModal from "../auth/LoginGuideModal";

export default function DiscoveryCreationFlow() {
  const {
    currentStep,
    nextStep,
    prevStep,
    cancelCreation,
    photoData,
    setPhotoData,
    setUserQuestion,
    generateAiResponse,
    isGenerating,
  } = useDiscoveryCreationStore();
  const { user } = useAuthStore();

  const handlePhotoTaken = (photo: string) => {
    setPhotoData(photo);
    nextStep();
  };

  const handleCommentSubmitUserQuestion = async (user_question: string) => {
    setUserQuestion(user_question);
    await generateAiResponse(); // AIの回答生成を待つ
    nextStep();
  };

  switch (currentStep) {
    case "shooting":
      return (
        <>
          <ShootingStep onNext={handlePhotoTaken} onCancel={cancelCreation} />
          <LoginGuideModal open={user === null} />
        </>
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
