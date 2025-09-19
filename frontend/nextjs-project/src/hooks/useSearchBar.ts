"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Post } from "@/types/post";

type UseHomeSearchBarProps = {
  setSelectedPost: Dispatch<SetStateAction<Post | null>>;
  setIsFollowing: Dispatch<SetStateAction<boolean>>;
};

type UseHomeSearchBarReturn = {
  searchQuery: string;
  handleSearch: (q: string) => void;
  handleQueryChange: (q: string) => void;
};

/**
 * SearchBar用の検索状態とハンドラーを管理するフック
 */
export function useHomeSearchBar({
  setSelectedPost,
  setIsFollowing,
}: UseHomeSearchBarProps): UseHomeSearchBarReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      // URLに検索クエリを反映（既存のクエリは保持）
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", q);
      router.replace(`${pathname}?${params.toString()}`);
      // 何か選択されていたら解除
      setSelectedPost(null);
      // 追従を一旦OFFに（検索結果に視線を移すため。移動制御は別途）
      setIsFollowing(false);
    },
    [pathname, router, searchParams, setSelectedPost, setIsFollowing],
  );

  const handleQueryChange = useCallback(
    (q: string) => {
      // 空文字を自動検知してリセットし、URLからqを削除
      if (q.trim() === "") {
        setSearchQuery("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
    },
    [pathname, router, searchParams, setSearchQuery],
  );

  return {
    searchQuery,
    handleSearch,
    handleQueryChange,
  };
}
