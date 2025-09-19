"use client";

import { useState, useEffect } from "react";

/**
 * URLを元にAPI経由でページのタイトルを取得するフック
 * @param url 対象のURL
 * @returns { title: string, isLoading: boolean }
 */
export const useUrlTitle = (url: string | null | undefined) => {
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // URLが無効な場合は何もしない
    if (!url) {
      setIsLoading(false);
      return;
    }

    const fetchTitle = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/get-url-title?url=${encodeURIComponent(url)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title);
        } else {
          setTitle(url); // APIエラー時はURLをそのまま表示
        }
      } catch (error) {
        console.error("Failed to fetch title via API:", error);
        setTitle(url); // 通信失敗時もURLをそのまま表示
      } finally {
        setIsLoading(false);
      }
    };

    fetchTitle();
  }, [url]); // urlが変わった時だけ再実行

  return { title, isLoading };
};
