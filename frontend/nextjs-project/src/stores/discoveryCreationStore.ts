"use client";

import { create } from "zustand";
import { saveImageAndPostToAi } from "@/libs/saveImageAndPostToAi";

// フローの各ステップを表す型
type CreationStep = "shooting" | "commenting" | "reviewing" | null;

// AIからのレスポンスデータの型
export interface AiResponse {
  answer: string;
  target: string;
  toi: string;
}

// ストアが持つ状態とアクションの型定義
interface DiscoveryCreationState {
  currentStep: CreationStep;
  photoData: string | null;
  question: string | null; // ユーザーが入力した質問
  aiResponse: AiResponse | null; // AIからのレスポンス
  isGenerating: boolean; // AIが応答を生成中かどうかのフラグ
  img_id: string; // アップロード結果
  startCreation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  cancelCreation: () => void;
  setPhotoData: (data: string) => void;
  setQuestion: (question: string) => void;
  generateAiResponse: () => Promise<void>; // AI応答を生成する非同期アクション
}

// ストアを作成
export const useDiscoveryCreationStore = create<DiscoveryCreationState>(
  (set) => ({
    // 初期状態
    currentStep: null,
    photoData: null,
    question: null,
    aiResponse: null,
    isGenerating: false,
    img_id: "",

    // アクション
    startCreation: () =>
      set({
        currentStep: "shooting",
        photoData: null,
        question: null,
        aiResponse: null,
        img_id: "",
      }),
    setPhotoData: (data) => set({ photoData: data }),
    setQuestion: (question) => set({ question }),

    generateAiResponse: async () => {
      const state = useDiscoveryCreationStore.getState();
      const { photoData, question } = state;

      set({ isGenerating: true });
      console.log("AIに応答をリクエスト中...");

      try {
        // 画像がある場合は実際のAPI呼び出し
        if (photoData && question) {
          const ac = new AbortController();
          const imageResult = await saveImageAndPostToAi(
            photoData,
            question,
            ac.signal
          );

          // APIレスポンスをAiResponse形式に変換
          const aiResponse: AiResponse = {
            answer: imageResult.answer.discovery,
            target: imageResult.answer.title,
            toi: imageResult.answer.question,
          };

          set({
            aiResponse,
            img_id: imageResult.img_id,
            isGenerating: false,
          });
        } else {
          // TODO: ダミーデータでやらなくてよいように方針考える
          // 画像がない場合はダミーデータ
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const dummyResponse: AiResponse = {
            answer:
              "画像がないため、詳細な解析はできませんが、質問に基づいてお答えします。",
            target: "不明",
            toi: "より詳しく調べるにはどうすればよいでしょうか？",
          };
          set({ aiResponse: dummyResponse, isGenerating: false });
        }

        console.log("AIからの応答を取得しました。");
      } catch (error) {
        console.error("AI応答の生成に失敗しました:", error);
        // エラー時もダミーデータで続行
        const errorResponse: AiResponse = {
          answer: "申し訳ございませんが、現在AI解析サービスに接続できません。",
          target: "エラー",
          toi: "しばらく時間をおいて再度お試しください。",
        };
        set({ aiResponse: errorResponse, isGenerating: false });
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
            question: null,
            aiResponse: null,
            img_id: "",
          }; // 完了時にリセット
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
            question: null,
            aiResponse: null,
            img_id: "",
          };
        return {};
      }),

    cancelCreation: () =>
      set({
        currentStep: null,
        photoData: null,
        question: null,
        aiResponse: null,
        img_id: "",
      }),
  })
);
