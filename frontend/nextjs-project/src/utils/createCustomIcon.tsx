import L from "leaflet";

/**
 * isSelectedの状態に応じて、適切なクラス名を持つL.divIconを生成する。
 * @param isSelected マーカーが選択されているかどうか
 * @returns Leafletのカスタムアイコンインスタンス
 */
export const createCustomIcon = (isSelected: boolean = false) => {
  // isSelectedに応じて、適用するCSSクラス名を切り替える
  const iconClassName = isSelected
    ? "custom-marker-selected"
    : "custom-marker-default";

  return L.divIcon({
    className: iconClassName,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};
