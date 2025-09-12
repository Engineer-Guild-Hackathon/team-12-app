import { create } from "zustand";

type FilterState = {
  sort: string;
  setSort: (newSort: string) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  // デフォルトの並び順
  sort: "newest",
  // 並び順を更新するためのアクション
  setSort: (newSort) => set({ sort: newSort }),
}));
