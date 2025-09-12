import { urlToFile } from "@/utils/urlToFile";
import { ImageAnalysisResponse } from "@/types/apiResponse";

/**
 * 画像とユーザーからの質問をAPIに送信する関数
 * @param photo - 画像のURL（dataURL または objectURL）
 * @param question - ユーザーの質問
 * @param signal - AbortController のシグナル（オプション）
 * @returns 画像解析APIレスポンス
 */
export const saveImageAndPostToAi = async (
  photo: string,
  question: string,
  signal?: AbortSignal
): Promise<ImageAnalysisResponse> => {
  // 画像あり：submit と同時に /api/images へ multipart でPOST
  const form = new FormData();
  const file = await urlToFile(photo, "photo.jpg");
  form.append("image_file", file); // Flask 側必須キー
  form.append("question", question);

  // Flask API のベースURL（例: https://api.example.com）
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const res = await fetch(`${API_BASE}/api/images`, {
    method: "POST",
    body: form,
    signal,
    // 認証Cookieを使う場合は必要に応じて
    // credentials: "include",
  });

  if (!res.ok) {
    // 失敗時はエラーを投げる
    const err = await res.json().catch(() => ({}));
    console.error("image upload failed:", err);
    throw new Error(err?.error || `HTTP ${res.status}`);
  }

  const json = await res.json();

  // レスポンス構造の検証とパース
  if (!json.img_id || !json.answer) {
    throw new Error("Invalid response structure from AI API");
  }

  const imageAnalysisResponse: ImageAnalysisResponse = {
    img_id: json.img_id,
    answer: {
      title: json.answer.title || "",
      discovery: json.answer.discovery || "",
      question: json.answer.question || "",
    },
  };

  return imageAnalysisResponse;
};
