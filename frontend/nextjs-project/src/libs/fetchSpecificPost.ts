import type { Post } from "@/types/post";

export const fetchSpecificPost = async (
  post_id: string,
  signal?: AbortSignal
): Promise<Post> => {
  const res = await fetch(`/api/posts/${post_id}`, {
    method: "GET",
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch post via proxy: ${res.status} ${text.slice(0, 200)}`
    );
    // 404 のときは「存在しない」などのUI出し分けもここで可能
  }

  const data = await res.json();
  // バックエンドは {"post": {...}} で返す想定
  if (!data?.post) {
    throw new Error("Unexpected response shape: missing 'post'");
  }
  return data.post as Post;
};
