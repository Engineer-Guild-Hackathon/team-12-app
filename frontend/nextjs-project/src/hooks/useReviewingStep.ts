import { useRouter } from "next/navigation";
import { AiResponse } from "@/stores/discoveryCreationStore";
import { createPost } from "@/libs/createNewPost";

type UseReviewingStep = {
  photoData: string | null;
  user_question: string | null; // ユーザーが入力した質問
  aiResponse: AiResponse | null; // AIからのレスポンス
  img_id: string; // アップロード結果
  nextStep: () => void;
  prevStep: () => void;
  latitude: number | null;
  longitude: number | null;
};

export const useReviewingStep = (params: UseReviewingStep) => {
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

  const handleSave = async () => {
    if (latitude === null || longitude === null) {
      alert(
        "位置情報が取得できません。位置情報の利用を許可してもう一度やり直してください。",
      );
      return;
    }
    if (!photoData || !user_question || !aiResponse) {
      alert("AIからのデータが不十分です。もう1度最初からやり直してください。");
      return;
    }

    try {
      // TODO: ユーザーIDと画像IDを適切に取得する
      // ここでは仮の値を使用
      // ユーザーidは未実装
      const payload = {
        user_id: "123e4567-e89b-12d3-a456-426614174000", // 認証から取得する想定
        img_id,
        user_question,
        object_label: aiResponse.object_label,
        ai_answer: aiResponse.ai_answer,
        ai_question: aiResponse.ai_question,
        latitude,
        longitude,
      };

      const post = await createPost(payload);
      nextStep();
      // ここまで画面全体のローディングを入れたい
      // TODO: ローディング終了処理
      router.push(`/discoveries/${post.post_id}`);
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。もう1度やり直してください。");
    }
  };

  return { handleSave };
};
