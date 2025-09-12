import { Post } from "@/types/post";

export const fetchPosts = async (signal: AbortSignal): Promise<Post[]> => {
  // limitは100まで。
  const res = await fetch("/api/posts?limit=100&offset=0", {
    method: "GET",
    signal,
    // App Router の Client fetch はデフォルトでcache: "force-cache"
    // APIの最新を常に取りたいなら no-store
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch posts via proxy: ${res.status} ${text.slice(0, 200)}`
    );
  }

  const data = await res.json();
  return Array.isArray(data.posts) ? data.posts : [];
};
