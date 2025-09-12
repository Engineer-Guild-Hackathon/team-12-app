/**
 * dataURL / objectURL を File に変換するユーティリティ関数
 * @param url - データURL または オブジェクトURL
 * @param filename - 生成するファイル名
 * @param mime - MIMEタイプ（省略時はblobのタイプまたは"image/jpeg"）
 * @returns File オブジェクト
 */
export const urlToFile = async (
  url: string,
  filename: string,
  mime?: string,
): Promise<File> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, {
    type: mime ?? (blob.type || "image/jpeg"),
  });
};
