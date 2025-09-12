import { Post } from "@/types/post";

export type CreatePostBody = {
  user_id: string;
  img_id: string;
  question: string;
  target: string;
  answer: string;
  toi: string;
  latitude: number | null;
  longitude: number | null;
};

export const createPost = async (
  body: CreatePostBody,
  signal?: AbortSignal
) => {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify(body),
    // 認証Cookieを使う場合は必要に応じて
    // credentials: "same-origin",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  const json = await res.json();

  return json.post as Post;
};
