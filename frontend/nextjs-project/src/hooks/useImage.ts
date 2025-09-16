"use client";

import useSWR from "swr";
import { ImageRecord } from "@/types/apiResponse";

/**
 * このフック専用のfetcher関数。
 * fetchImage.tsのロジックをここに統合します。
 * @param url フェッチ先のURL (SWRがキーから渡してくれる)
 * @returns 整形されたImageRecordオブジェクト
 */
const imageFetcher = async (url: string): Promise<ImageRecord> => {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const errorInfo = await res.json().catch(() => ({}));
    const text =
      errorInfo?.error || `Failed to fetch image via proxy: ${res.status}`;
    const error = new Error(text);
    throw error;
  }

  const data = await res.json();
  if (!data?.image) {
    throw new Error("Unexpected response shape: missing 'image' key");
  }
  return data.image as ImageRecord;
};

/**
 * 特定の画像をimgIdで取得するためのSWRカスタムフック
 * @param imgId 画像のID
 */
export function useImage(imgId: string | null) {
  const key = imgId ? `/api/images/${imgId}` : null;

  const { data, error, isLoading } = useSWR<ImageRecord>(key, imageFetcher);

  return {
    imageUrl: data?.signed_url,
    isLoading,
    isError: error,
  };
}
