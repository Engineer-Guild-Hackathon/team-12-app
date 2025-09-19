import { Post } from "@/types/post";

type SearchResponse = {
  posts: Post[];
};

/**
 * フロント内の内部API（Route Handler）経由で検索を行う。
 * ここでは window.fetch を使い、クライアント側のフック（例: usePosts）や
 * サーバーアクション、ハンドラーなどから利用される。
 */
export async function searchPostsViaRouteHandler(params: {
  q: string;
  limit?: number;
}): Promise<SearchResponse> {
  const { q, limit } = params;
  const qs = new URLSearchParams();
  qs.set("q", q);
  if (typeof limit === "number") qs.set("limit", String(limit));

  const resp = await fetch(`/api/search?${qs.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = (await resp.json()) as SearchResponse;
  if (!resp.ok) {
    const msg =
      (data as unknown as { error?: string }).error ?? "検索に失敗しました";
    throw new Error(msg);
  }
  return data;
}
