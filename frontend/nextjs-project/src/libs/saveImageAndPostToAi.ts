import { urlToFile } from "@/utils/urlToFile";
import { ImageAnalysisResponse } from "@/types/apiResponse";

/**
 * 画像とユーザーからの質問をAPIに送信する関数
 * @param photo - 画像のURL（dataURL または objectURL）
 * @param user_question - ユーザーの質問
 * @param signal - AbortController のシグナル（オプション）
 * @returns 画像解析APIレスポンス
 */
export const saveImageAndPostToAi = async (
  photo: string,
  user_question: string,
  signal?: AbortSignal,
): Promise<ImageAnalysisResponse> => {
  if (!photo) throw new Error("photo is empty");
  if (!user_question) throw new Error("user_question is empty");

  // 画像あり：submit と同時に /api/images へ multipart でPOST
  const form = new FormData();
  const file = await urlToFile(photo, "photo.jpg");
  form.append("img_file", file); // Flask 側必須キー
  form.append("user_question", user_question);

  // Next.js のAPIルート（プロキシ）を経由してバックエンドへ転送
  const res = await fetch("/api/image_analyze", {
    method: "POST",
    body: form,
    signal,
    // Cookie 認証を使う場合は same-origin を推奨
    // credentials: "same-origin",
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
      object_label: json.answer.object_label || "",
      ai_answer: json.answer.ai_answer || "",
      ai_question: json.answer.ai_question || "",
    },
  };

  return imageAnalysisResponse;
};
