import { backendFetch } from "@/libs/backendFetch";
import { ImageRecord } from "@/types/apiResponse";

// v1–v5 UUID の簡易チェック
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * サーバーサイドで画像IDから画像レコードを取得するための共通関数。
 * APIルートやサーバーコンポーネントから直接呼び出す。
 * @param imgId 取得したい画像のID
 * @returns 成功した場合はImageRecord、失敗した場合はnull
 */
export async function fetchImageRecordById(
  imgId: string,
): Promise<ImageRecord | null> {
  // IDがUUID形式でなければ、APIに問い合わせる前にエラーとする
  if (!UUID_RE.test(imgId)) {
    console.error("Invalid UUID format for imgId:", imgId);
    return null;
  }

  try {
    const res = await backendFetch(`/api/images/${imgId}`, {
      method: "GET",
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      // res.json()を試みて、より詳細なエラーを取得
      const errorBody = await res.json().catch(() => ({}));
      console.error(
        `Backend API failed for imgId ${imgId}. Status: ${res.status}`,
        errorBody,
      );
      return null;
    }

    const data = await res.json();
    if (!data?.image) {
      console.error(
        "Unexpected response shape from image API: missing 'image' key",
      );
      return null;
    }

    return data.image as ImageRecord;
  } catch (error) {
    console.error(`Error in fetchImageRecordById for ${imgId}:`, error);
    return null;
  }
}
