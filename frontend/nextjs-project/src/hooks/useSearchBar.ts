"use client";

import { useCallback, Dispatch, SetStateAction, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Post } from "@/types/post";
import { useFilterStore } from "@/stores/filterStore";
import { useSWRConfig } from "swr";
import { useAuthStore } from "@/stores/authStore";

type UseHomeSearchBarProps = {
  setSelectedPost: Dispatch<SetStateAction<Post | null>>;
  setIsFollowing: Dispatch<SetStateAction<boolean>>;
};

type UseSearchBarReturn = {
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
}: UseHomeSearchBarProps): UseSearchBarReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useFilterStore();

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
    [
      pathname,
      router,
      searchParams,
      setSelectedPost,
      setIsFollowing,
      setSearchQuery,
    ],
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

/**
 * リストページ用のSearchBar状態とハンドラーを管理するフック
 */
export function useListSearchBar(): UseSearchBarReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useFilterStore();
  const { mutate } = useSWRConfig();
  const user = useAuthStore((state) => state.user);

  // URL -> store 同期
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", q);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams, setSearchQuery],
  );

  const handleQueryChange = useCallback(
    (q: string) => {
      if (q.trim() === "") {
        const oldQuery = searchQuery;

        // 1. URLとストアの状態をリセット
        setSearchQuery("");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);

        // 2. 不要になった古い検索結果のキャッシュをSWRから手動で削除
        if (oldQuery.trim().length > 0) {
          const oldSearchKey = [
            "search",
            user?.uid ? user.uid : "public",
            oldQuery.trim(),
          ].join(":");
          // 第2引数にundefinedを渡すとキャッシュが削除される
          mutate(oldSearchKey, undefined, { revalidate: false });
        }
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
