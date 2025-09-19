"use client";

import { useRouter } from "next/navigation";
import { useTransition, useEffect, useState } from "react";
import { AiResponse } from "@/stores/discoveryCreationStore";
import { createPostAction, CreatePostPayload } from "@/app/actions/postActions";
import { useAuthStore } from "@/stores/authStore";
import { useSWRConfig } from "swr";

type UseReviewingStepParams = {
  photoData: string | null;
  user_question: string | null;
  aiResponse: AiResponse | null;
  img_id: string;
  nextStep: () => void;
  prevStep: () => void;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
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
    location,
  } = params;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { mutate } = useSWRConfig();
  const [isPublic, setIsPublic] = useState<boolean>(true);

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
      ai_reference:
        Array.isArray(aiResponse.grounding_urls) &&
        aiResponse.grounding_urls.length > 0
          ? aiResponse.grounding_urls[0]
          : null,
      is_public: Boolean(isPublic),
      post_rarity: 0, // TODO: aiResponseで将来希少度を取得する
      latitude,
      longitude,
      location: location ?? null,
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
        // 1. 更新すべきSWRキーを特定
        const swrKeyToMutate = user?.uid
          ? `recent:${user.uid}`
          : `recent:public`;

        // 2. SWRキャッシュに再検証を命令
        // これにより、次に一覧ページに戻ったときに最新のデータが即座に表示される
        mutate(swrKeyToMutate);

        nextStep();
        router.push(`/discoveries/${result.data.post_id}`);
      }
    });
  };

  return {
    handleSave,
    isLoading: isPending,
    isPublic,
    setIsPublic,
  };
};
