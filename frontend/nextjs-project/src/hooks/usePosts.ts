"use client";

import useSWR from "swr";
import { Post } from "@/types/post";
import { fetcher } from "@/libs/fetcher";

type PostsApiResponse = {
  posts: Post[];
};

/**
 * 投稿の一覧を取得するためのSWRカスタムフック。
 * 15秒ごとの自動更新機能付き。
 */
export function usePosts() {
  const key = "/api/posts?limit=100&offset=0";

  const { data, error } = useSWR<PostsApiResponse>(key, fetcher, {
    // 300000ミリ秒（5分）ごとにデータを自動的に再取得します。
    // ユーザーが別のタブを見ているときや、ネットワークがオフラインのときは、
    // SWRが賢くポーリングを一時停止してくれます。
    refreshInterval: 300000,
    suspense: true,
  });

  return {
    posts: data?.posts,
    // isLoading,
    isError: error,
  };
}
