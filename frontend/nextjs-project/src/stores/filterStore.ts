import { create } from "zustand";

type FilterState = {
  sort: string;
  searchQuery: string;
  setSort: (newSort: string) => void;
  setSearchQuery: (q: string) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  // デフォルトの並び順
  sort: "newest",
  // 検索クエリ（ページ間で保持）
  searchQuery: "",
  // 並び順を更新するためのアクション
  setSort: (newSort) => set({ sort: newSort }),
  // 検索クエリを更新するためのアクション
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
