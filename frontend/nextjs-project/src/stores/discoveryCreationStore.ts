"use client";

import { create } from "zustand";

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

    // アクション
    startCreation: () =>
      set({
        currentStep: "shooting",
        photoData: null,
        question: null,
        aiResponse: null,
      }),
    setPhotoData: (data) => set({ photoData: data }),
    setQuestion: (question) => set({ question }),

    generateAiResponse: async () => {
      set({ isGenerating: true });
      console.log("AIに応答をリクエスト中...");

      // --- ここで実際にAI APIを呼び出す ---
      // 今回はダミーデータでシミュレート
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2秒待機
      const dummyResponse: AiResponse = {
        answer:
          "これは「エゾリス」です。冬毛で耳が長くなっているのが特徴で、北海道の森林に生息しています。主に木の実を食べます。",
        target: "エゾリス",
        toi: "なぜエゾリスは、冬になると耳の毛が長くなるのでしょうか？",
      };
      // ------------------------------------

      set({ aiResponse: dummyResponse, isGenerating: false });
      console.log("AIからの応答を取得しました。");
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
          };
        return {};
      }),

    cancelCreation: () =>
      set({
        currentStep: null,
        photoData: null,
        question: null,
        aiResponse: null,
      }),
  }),
);
