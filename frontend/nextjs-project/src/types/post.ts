/**
 * postsテーブルのレコード一件分を表す型定義
 */
export interface Post {
  /** 投稿の一意なID (UUID) */
  post_id: string;
  /** 投稿したユーザーのID (UUID) */
  user_id: string;
  /** 投稿された画像のID (UUID) */
  img_id: string;
  /** ユーザーがAIに投げかけた質問文 */
  user_question: string;
  /** AIからの回答文 */
  ai_answer: string;
  /** AIが生成した問い */
  ai_question: string;
  /** 画像の物体ラベル */
  object_label: string;
  /** 参考にしたURL（任意） */
  ai_reference: string | null;
  location: string;
  /** 緯度 (数値) */
  latitude: number;
  /** 経度 (数値) */
  longitude: number;
  /** 公開フラグ */
  is_public: boolean;
  /** 希少度（0以上の整数） */
  post_rarity: number;
  /** 投稿日時 (ISO 8601形式の文字列) */
  date: string;
  /** 更新日時 (ISO 8601形式の文字列) */
  updated_at: string;
}
