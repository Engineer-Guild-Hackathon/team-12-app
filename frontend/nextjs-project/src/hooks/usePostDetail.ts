"use client";

import useSWR from "swr";
import { Post } from "@/types/post";
import { fetcher } from "@/libs/fetcher";

// APIからのレスポンスの型を定義
type PostDetailApiResponse = {
  post: Post;
};

/**
 * 特定の投稿をID(slug)で取得するためのSWRカスタムフック
 * @param slug 投稿のID
 */
export function usePostDetail(slug: string | null) {
  const key = slug ? `/api/posts/${slug}` : null;

  // SWRにキーとfetcherを渡す
  const { data, error, isLoading } = useSWR<PostDetailApiResponse>(
    key,
    fetcher,
  );

  return {
    post: data?.post,
    isLoading,
    isError: error,
  };
}
