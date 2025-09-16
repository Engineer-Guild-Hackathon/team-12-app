"use server";

import { ImageAnalysisResponse } from "@/types/apiResponse";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://back-server:5000";

/**
 * 画像と質問をFlaskに送信し、AIの解析結果を取得するためのサーバーアクション。
 * @param formData FormDataオブジェクト。'img_file'と'user_question'を含む必要がある。
 * @returns 成功した場合は { data: ImageAnalysisResponse }, 失敗した場合は { error: string }
 */
export async function analyzeImageAction(
  formData: FormData,
): Promise<{ data?: ImageAnalysisResponse; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/image_analyze`, {
      method: "POST",
      body: formData,
      cache: "no-store",
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
      },
    };
    return { data: imageAnalysisResponse };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("analyzeImageAction Error:", errorMessage);
    return { error: errorMessage };
  }
}
