import { ImageRecord, ImageResponse } from "@/types/apiResponse";

// 画像メタ情報（署名付きURL等）を取得
export const fetchImage = async (
  imgId: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<ImageRecord> => {
  const res = await fetch(`/api/images/${imgId}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!res.ok) {
    // 失敗時は本文を拾ってエラーにする
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch image via proxy: ${res.status} ${text.slice(0, 200)}`
    );
  }

  const data = (await res.json().catch(() => ({}))) as Partial<ImageResponse>;
  if (!data?.image) {
    throw new Error("Invalid response shape: missing 'image'");
  }
  return data.image;
};
