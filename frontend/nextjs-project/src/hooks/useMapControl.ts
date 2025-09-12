"use client";

import { useState, useEffect } from "react";
import L, { LatLngExpression } from "leaflet";

// フックが返す値の型定義
interface MapControl {
  position: LatLngExpression;
  isLoading: boolean;
  setMap: (map: L.Map | null) => void;
  handleRecenter: () => void;
}

export function useMapControl(): MapControl {
  const [position, setPosition] = useState<LatLngExpression>([43.068, 141.35]); // 初期位置: 札幌駅
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<L.Map | null>(null);

  // 初回の現在地取得
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        setPosition([
          geoPosition.coords.latitude,
          geoPosition.coords.longitude,
        ]);
        setIsLoading(false);
      },
      (error) => {
        console.error("現在地の取得に失敗:", error);
        setIsLoading(false);
      },
    );
  }, []);

  // 現在地に戻る処理
  const handleRecenter = () => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition((geoPosition) => {
      const newPos: LatLngExpression = [
        geoPosition.coords.latitude,
        geoPosition.coords.longitude,
      ];
      setPosition(newPos);
      map.flyTo(newPos, 16);
    });
  };

  return { position, isLoading, setMap, handleRecenter };
}
