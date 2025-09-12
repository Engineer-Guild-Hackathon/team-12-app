import { Post } from "@/types/post";

export const fetchPosts = async (signal: AbortSignal): Promise<Post[]> => {
  // バックエンドが別ホスト/ポートなら環境変数でベースURLを渡す
  // 例）NEXT_PUBLIC_API_BASE="http://localhost:5000"
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const url = `${base}/api/posts?limit=200&offset=0`;
  const res = await fetch(url, {
    method: "GET",
    signal,
    // App Router の Client fetch はデフォルトでcache: "force-cache"
    // APIの最新を常に取りたいなら no-store
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch posts: ${res.status} ${text}`);
  }

  const data = await res.json();
  return Array.isArray(data.posts) ? data.posts : [];
};
