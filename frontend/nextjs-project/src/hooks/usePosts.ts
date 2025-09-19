"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { Post } from "@/types/post";
import { calculateDistance } from "@/utils/calculateDistance";
import { useAuthStore, AuthState } from "@/stores/authStore";
import {
  fetchRecentPostsAction,
  fetchRecentPublicPostsAction,
} from "@/app/actions/getRecentAndPostUserIdActions";
import { searchPostsViaRouteHandler } from "@/libs/searchPosts";

type PostsApiResponse = {
  posts: Post[];
};

type UsePostsParams = {
  sort?: string | null;
  scope?: string | null;
  userId?: string | null; // 「自分」を判定するためのユーザーID
  currentLocation?: { latitude: number | null; longitude: number | null }; // 「近い順」ソート用
  query?: string | null; // 検索クエリ（空文字列やnullは検索なし）
};

/**
 * 投稿の一覧を取得し、フロントエンドでフィルタリングとソートを行うSWRカスタムフック
 * 30秒ごとの自動更新機能付き。
 * @param params sort, scope, userId, currentLocation を含むオブジェクト
 */
export function usePosts(
  params: UsePostsParams = {},
  fallbackData?: PostsApiResponse,
) {
  const { sort, scope, userId, currentLocation, query } = params;
  const user = useAuthStore((s: AuthState) => s.user);
  const normalizedQuery = (query ?? "").trim();
  const isSearchMode = normalizedQuery.length > 0;
  // これは検索ブランチで実装したswrKeyです
  const swrKey = isSearchMode
    ? ["search", user?.uid ? user.uid : "public", normalizedQuery].join(":")
    : user?.uid
      ? `recent:${user.uid}`
      : `recent:public`;
  // 最新のmainブランチのswrKeyです
  // const swrKey = user?.uid ? `recent:${user.uid}` : `recent:public`;

  const { data, error, mutate } = useSWR<PostsApiResponse>(
    swrKey,
    async () => {
      // TODO: これ外側で関数定義したい
      // サーバーアクションをクライアントから呼ぶ（ログイン状態で分岐）
      // 検索クエリがある場合は検索APIを利用
      if (isSearchMode) {
        const { posts } = await searchPostsViaRouteHandler({
          q: normalizedQuery,
        });
        return { posts } satisfies PostsApiResponse;
      }

      // 検索クエリがない場合は最近の投稿を取得（ログイン状態で分岐）
      const { posts } = user?.uid
        ? await fetchRecentPostsAction(user.uid)
        : await fetchRecentPublicPostsAction();
      return { posts } satisfies PostsApiResponse;
    },
    {
      refreshInterval: 30000,
      dedupingInterval: 30000,
      suspense: true,
      // 検索時はfallbackDataを使わない（前回の一覧を誤表示しないため）
      fallbackData: isSearchMode ? undefined : fallbackData,
    },
  );

  const filteredPosts = useMemo(() => {
    if (!data?.posts) {
      return [];
    }

    // --- 1. スコープによるフィルタリング ---
    let postsToFilter = data.posts;
    if (scope === "mine") {
      postsToFilter = data.posts.filter(
        (post: Post) => post.user_id === userId,
      );
    }

    // --- 2. ソート順による並び替え ---
    const sortedPosts = [...postsToFilter]; // 元の配列を破壊しないようにコピー

    switch (sort) {
      case "newest":
        sortedPosts.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        break;
      case "oldest":
        sortedPosts.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
        break;
      case "nearest":
        if (currentLocation?.latitude && currentLocation?.longitude) {
          sortedPosts.sort((a, b) => {
            const distA = calculateDistance(
              currentLocation.latitude!,
              currentLocation.longitude!,
              a.latitude,
              a.longitude,
            );
            const distB = calculateDistance(
              currentLocation.latitude!,
              currentLocation.longitude!,
              b.latitude,
              b.longitude,
            );
            return distA - distB;
          });
        }
        break;
      // TODO: "recommended" (おすすめ順)を実装する
      default:
        break;
    }

    return sortedPosts;

    // data, sort, scope, userId, currentLocation のいずれかが変更された場合のみ再計算
  }, [data, sort, scope, userId, currentLocation]);

  return {
    posts: filteredPosts, // フィルタリング・ソート済みの結果を返す
    isError: error,
    mutate,
  };
}
