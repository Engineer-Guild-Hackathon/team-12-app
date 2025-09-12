import React from "react";
import { MdSunny } from "react-icons/md";
import { RiMoonClearFill } from "react-icons/ri";
import { TbSunset2 } from "react-icons/tb";
import { TimeOfDayIcon } from "@/utils/formatDate";

/**
 * アイコン名を受け取り、対応するReactアイコンコンポーネントを返す
 * @param iconName - 'sun', 'sunset', 'moon' のいずれか
 * @returns React.ReactElement or null
 */
export default function getIconComponent(iconName: TimeOfDayIcon) {
  if (iconName === "sun") return <MdSunny size={20} />;
  if (iconName === "sunset") return <TbSunset2 size={20} />;
  if (iconName === "moon") return <RiMoonClearFill size={20} />;
  return null;
}
