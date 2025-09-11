"use client";

import { create } from "zustand";

// フローの各ステップを表す型
type CreationStep = "shooting" | "commenting" | "reviewing" | null;

// ストアが持つ状態とアクションの型定義
interface DiscoveryCreationState {
  currentStep: CreationStep;
  photoData: string | null;
  startCreation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  cancelCreation: () => void;
  setPhotoData: (data: string) => void;
}

// ストアを作成
export const useDiscoveryCreationStore = create<DiscoveryCreationState>(
  (set) => ({
    // 初期状態
    currentStep: null,
    photoData: null,

    // 状態を更新するためのアクション
    startCreation: () => set({ currentStep: "shooting" }),

    setPhotoData: (data) => set({ photoData: data }),

    nextStep: () =>
      set((state) => {
        if (state.currentStep === "shooting")
          return { currentStep: "commenting" };
        if (state.currentStep === "commenting")
          return { currentStep: "reviewing" };
        // reviewigの後はフローを終了
        if (state.currentStep === "reviewing") return { currentStep: null };
        return {};
      }),

    prevStep: () =>
      set((state) => {
        if (state.currentStep === "reviewing")
          return { currentStep: "commenting" };
        if (state.currentStep === "commenting")
          return { currentStep: "shooting" };
        if (state.currentStep === "shooting") return { currentStep: null }; // 撮影画面から戻ったらフローを終了
        return {};
      }),

    cancelCreation: () => set({ currentStep: null }),
  }),
);
