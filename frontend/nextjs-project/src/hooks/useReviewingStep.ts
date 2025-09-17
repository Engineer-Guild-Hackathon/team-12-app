"use client";

import { useRouter } from "next/navigation";
import { useTransition, useEffect } from "react";
import { AiResponse } from "@/stores/discoveryCreationStore";
import { createPostAction, CreatePostPayload } from "@/app/actions/postActions";
import { useAuthStore } from "@/stores/authStore";

type UseReviewingStepParams = {
  photoData: string | null;
  user_question: string | null;
  aiResponse: AiResponse | null;
  img_id: string;
  nextStep: () => void;
  prevStep: () => void;
  latitude: number | null;
  longitude: number | null;
};

export const useReviewingStep = (params: UseReviewingStepParams) => {
  const {
    photoData,
    user_question,
    aiResponse,
    nextStep,
    latitude,
    longitude,
    img_id,
  } = params;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // ログインせずに撮影機能は使用できないため想定していないが念のため
  // if節だと条件付きhook呼び出しのためuseEffectを使う
  useEffect(() => {
    if (user === null) {
      alert("ログインしてください");
      router.push("/login");
    }
  }, [user, router]);

  // Server Actionの実行状態（ローディング中か否か）を管理するためのフック
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (latitude === null || longitude === null) {
      alert(
        "位置情報が取得できません。位置情報の利用を許可してもう一度やり直してください",
      );
      return;
    }
    if (!photoData || !user_question || !aiResponse) {
      alert("AIからのデータが不十分です。もう1度最初からやり直してください。");
      return;
    }

    const payload: CreatePostPayload = {
      user_id: user?.uid ?? "", // userがnullの時useEffectが走るので""は想定されない
      img_id,
      user_question,
      object_label: aiResponse.object_label,
      ai_answer: aiResponse.ai_answer,
      ai_question: aiResponse.ai_question,
      latitude,
      longitude,
    };

    // startTransitionでServer Actionの呼び出しをラップします。
    // この中の処理が完了するまでisPendingがtrueになります。
    startTransition(async () => {
      const result = await createPostAction(payload);

      if (result.error) {
        console.error(result.error);
        alert("保存に失敗しました。もう1度やり直してください。");
        return;
      }

      if (result.data) {
        nextStep();
        router.push(`/discoveries/${result.data.post_id}`);
      }
    });
  };

  return {
    handleSave,
    isLoading: isPending,
  };
};
