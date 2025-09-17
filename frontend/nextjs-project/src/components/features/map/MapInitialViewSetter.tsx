"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapInitialViewSetterProps {
  position: [number, number];
}

/**
 * 地図の初期表示位置を一度だけ設定するためのヘルパーコンポーネント。
 */
export default function MapInitialViewSetter({
  position,
}: MapInitialViewSetterProps) {
  const map = useMap();

  useEffect(() => {
    // mapインスタンスとpositionが利用可能な場合、一度だけビューを設定
    if (map && position) {
      map.setView(position, 16);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]); // mapインスタンスが準備できた時に実行

  return null;
}
