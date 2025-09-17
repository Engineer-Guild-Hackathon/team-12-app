"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapViewControllerProps {
  position: [number, number];
  isFollowing: boolean;
}

/**
 * ユーザーの現在地に合わせて地図表示を制御するためのヘルパーコンポーネント。
 */
export default function MapViewController({
  position,
  isFollowing,
}: MapViewControllerProps) {
  const map = useMap();

  useEffect(() => {
    // 追従モードが有効な場合、地図の中心を現在地に合わせる
    if (isFollowing) {
      map.panTo(position);
    }
  }, [position, isFollowing, map]); // positionかisFollowingが変わるたびに実行

  return null;
}
