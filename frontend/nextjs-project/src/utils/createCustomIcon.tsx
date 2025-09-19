import L from "leaflet";

/**
 * isSelectedの状態に応じて、適切なクラス名を持つL.divIconを生成する。
 * @param isSelected マーカーが選択されているかどうか
 * @returns Leafletのカスタムアイコンインスタンス
 */
export const createCustomIcon = (
  isSelected: boolean = false,
  isPr: boolean = false,
) => {
  // isSelected / isPr に応じて、適用するCSSクラス名を切り替える
  let iconClassName: string;
  if (isPr) {
    iconClassName = isSelected
      ? "custom-marker-pr-selected"
      : "custom-marker-pr-default";
  } else {
    iconClassName = isSelected
      ? "custom-marker-selected"
      : "custom-marker-default";
  }

  return L.divIcon({
    className: iconClassName,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};
