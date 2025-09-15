/**
 * SWRのための汎用的なfetcher関数。
 * URLを引数に取り、レスポンスをJSONとして返す。
 * @param url フェッチ先のURL
 * @returns レスポンスのJSONデータ
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errorInfo = await res.json().catch(() => ({}));
    const error = new Error(
      errorInfo?.error ||
        `An error occurred while fetching the data. (HTTP ${res.status})`,
    );
    throw error;
  }

  return res.json();
};
