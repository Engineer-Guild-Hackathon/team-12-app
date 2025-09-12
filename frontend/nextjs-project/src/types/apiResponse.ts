/**
 * 画像解析APIからのレスポンス構造を表す型定義
 */

/** 画像解析AIからの回答内容 */
export interface ImageAnalysisAnswer {
  /** タイトル */
  title: string;
  /** 発見内容 */
  discovery: string;
  /** 質問 */
  question: string;
}

/** 画像解析API レスポンス */
export interface ImageAnalysisResponse {
  /** 画像ID */
  img_id: string;
  /** AIからの回答 */
  answer: ImageAnalysisAnswer;
}
