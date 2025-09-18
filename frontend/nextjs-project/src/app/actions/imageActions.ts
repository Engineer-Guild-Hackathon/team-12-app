// ./frontend/nextjs-project/src/app/actions/imageActions.ts
"use server";

import { ImageAnalysisResponse } from "@/types/apiResponse";
import { backendFetch } from "@/libs/backendFetch";

/**
 * 画像と質問をFlaskに送信し、AIの解析結果を取得するためのサーバーアクション。
 * - 送信必須: 'img_file', 'user_question'
 * - 送信任意: 'latitude', 'longitude'（数値を文字列として）
 * レスポンスには 'img_id', 'ai_response', 'location'(任意) が含まれます。
 * @param formData FormDataオブジェクト。
 * @returns 成功した場合は { data: ImageAnalysisResponse }, 失敗した場合は { error: string }
 */
export async function analyzeImageAction(
  formData: FormData,
): Promise<{ data?: ImageAnalysisResponse; error?: string }> {
  try {
    const res = await backendFetch(`/api/image_analyze`, {
      method: "POST",
      cache: "no-store",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || `Backend API returned HTTP ${res.status}`);
    }
    if (!json.img_id || !json.ai_response) {
      throw new Error("Invalid response structure from AI API");
    }
    const imageAnalysisResponse: ImageAnalysisResponse = {
      img_id: json.img_id,
      ai_response: {
        object_label: json.ai_response.object_label || "",
        ai_answer: json.ai_response.ai_answer || "",
        ai_question: json.ai_response.ai_question || "",
        grounding_urls: Array.isArray(json.ai_response.grounding_urls)
          ? json.ai_response.grounding_urls.filter(
              (u: unknown) => typeof u === "string",
            )
          : [],
      },
      location: typeof json.location === "string" ? json.location : null,
    };
    return { data: imageAnalysisResponse };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("analyzeImageAction Error:", errorMessage);
    return { error: errorMessage };
  }
}
