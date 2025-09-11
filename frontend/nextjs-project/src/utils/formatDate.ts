// アイコンの種類を表す型を定義
export type TimeOfDayIcon = "sun" | "sunset" | "moon";

/**
 * ISO形式の日付文字列を受け取り、時刻に応じたアイコン名と
 * フォーマット済みの文字列を返す、サーバーサイドで安全な関数
 * @param dateString - ISO 8601形式の日付文字列
 * @returns { iconName: TimeOfDayIcon, formattedDate: string }
 */
export const formatTimestampForServer = (dateString: string) => {
  const date = new Date(dateString);
  // サーバーのタイムゾーンに依存しないよう、UTC基準で時間を取得
  const hour = date.getUTCHours();
  // JSTに変換 (UTC+9)
  const jstHour = (hour + 9) % 24;

  let iconName: TimeOfDayIcon;
  if (jstHour >= 5 && jstHour < 17) {
    iconName = "sun"; // 朝、昼
  } else if (jstHour >= 17 && jstHour < 20) {
    iconName = "sunset"; // 夕方
  } else {
    iconName = "moon"; // 夜
  }

  const formattedDate = `${date.getMonth() + 1}月 ${jstHour}時ごろ`;

  return { iconName, formattedDate };
};
