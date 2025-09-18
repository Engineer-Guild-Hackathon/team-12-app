/** 画像解析AIからの回答内容 */
export interface ImageAnalysisAnswer {
  /** 画像の物体ラベル */
  object_label: string;
  /** AIからの回答文 */
  ai_answer: string;
  /** AIが生成した問い */
  ai_question: string;
  /** グラウンディングで参照したURLの配列（0件可） */
  grounding_urls: string[];
}

/** 画像解析API レスポンス */
export interface ImageAnalysisResponse {
  /** 画像ID */
  img_id: string;
  /** AIからの回答 */
  ai_response: ImageAnalysisAnswer;
  /** 逆ジオコーディングされた位置（可能なら） */
  location: string | null;
}

// 画像1件のレコード
export type ImageStatus = "stored" | "processing" | "failed";

export type ImageRecord = {
  img_id: string; // UUID
  gcs_uri: string; // gs://bucket/path/to.jpg
  mime_type: string; // 例: "image/jpeg"
  size_bytes: number; // バイト数
  sha256_hex: string; // 例: "a1b2c3d4e5f6..."
  status: ImageStatus; // 例: "stored"
  signed_url: string; // 署名付きURL（期限付き）
  created_at: string; // ISO8601（UTC）文字列
  updated_at: string; // ISO8601（UTC）文字列
};

/** 画像1枚GETのレスポンス */
export type ImageResponse = {
  image: ImageRecord;
};
