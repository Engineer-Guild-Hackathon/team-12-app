"use client";

import { create } from "zustand";
import { analyzeImageAction } from "@/app/actions/imageActions";
import { urlToFile } from "@/utils/urlToFile";

// フローの各ステップを表す型
type CreationStep = "shooting" | "commenting" | "reviewing" | null;

// AIからのレスポンスデータの型
export interface AiResponse {
  ai_answer: string;
  object_label: string;
  ai_question: string;
  grounding_urls: string[];
}

// ストアが持つ状態とアクションの型定義
interface DiscoveryCreationState {
  currentStep: CreationStep;
  photoData: string | null;
  user_question: string | null;
  aiResponse: AiResponse | null;
  isGenerating: boolean;
  img_id: string;
  startCreation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  cancelCreation: () => void;
  setPhotoData: (data: string) => void;
  setUserQuestion: (user_question: string) => void;
  generateAiResponse: () => Promise<void>;
}

// ストアを作成
export const useDiscoveryCreationStore = create<DiscoveryCreationState>(
  (set, get) => ({
    // 初期状態
    currentStep: null,
    photoData: null,
    user_question: null,
    aiResponse: null,
    isGenerating: false,
    img_id: "",

    // アクション
    startCreation: () =>
      set({
        currentStep: "shooting",
        photoData: null,
        user_question: null,
        aiResponse: null,
        img_id: "",
      }),
    setPhotoData: (data) => set({ photoData: data }),
    setUserQuestion: (user_question) => set({ user_question }),

    generateAiResponse: async () => {
      const { photoData, user_question } = get();

      if (!photoData || !user_question) {
        console.warn("Photo data or user question is missing.");
        // 必要に応じてエラー時のダミーデータ処理
        return;
      }

      set({ isGenerating: true });
      console.log("AIに応答をリクエスト中...");

      try {
        // 1. FormDataをクライアントサイドで作成
        const form = new FormData();
        const file = await urlToFile(photoData, "photo.jpg");
        form.append("img_file", file);
        form.append("user_question", user_question);

        // 2. 作成したServer Actionを直接呼び出す
        const result = await analyzeImageAction(form);

        // 3. Server Actionからの返り値をチェック
        if (result.error) {
          // エラーがあれば、それをスローしてcatchブロックで処理
          throw new Error(result.error);
        }

        if (result.data) {
          // 成功した場合、レスポンスをストアの状態にセット
          const imageResult = result.data;
          const aiResponse: AiResponse = {
            ai_answer: imageResult.ai_response.ai_answer,
            object_label: imageResult.ai_response.object_label,
            ai_question: imageResult.ai_response.ai_question,
            grounding_urls: imageResult.ai_response.grounding_urls ?? [],
          };

          set({
            aiResponse,
            img_id: imageResult.img_id,
          });
          console.log("AIからの応答を取得しました。");
        }
      } catch (error) {
        console.error("AI応答の生成に失敗しました:", error);
        // エラー時のUIフィードバック
        const errorResponse: AiResponse = {
          ai_answer:
            "申し訳ございませんが、現在AI解析サービスに接続できません。",
          object_label: "エラー",
          ai_question: "しばらく時間をおいて再度お試しください。",
        };
        set({ aiResponse: errorResponse });
      } finally {
        // 成功・失敗に関わらずローディング状態を解除
        set({ isGenerating: false });
      }
    },

    nextStep: () =>
      set((state) => {
        if (state.currentStep === "shooting")
          return { currentStep: "commenting" };
        if (state.currentStep === "commenting")
          return { currentStep: "reviewing" };
        if (state.currentStep === "reviewing")
          return {
            currentStep: null,
            photoData: null,
            user_question: null,
            aiResponse: null,
            img_id: "",
          };
        return {};
      }),

    prevStep: () =>
      set((state) => {
        if (state.currentStep === "reviewing")
          return { currentStep: "commenting" };
        if (state.currentStep === "commenting")
          return { currentStep: "shooting" };
        if (state.currentStep === "shooting")
          return {
            currentStep: null,
            photoData: null,
            user_question: null,
            aiResponse: null,
            img_id: "",
          };
        return {};
      }),

    cancelCreation: () =>
      set({
        currentStep: null,
        photoData: null,
        user_question: null,
        aiResponse: null,
        img_id: "",
      }),
  }),
);
