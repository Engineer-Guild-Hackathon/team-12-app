"use client";

import { useState, useCallback } from "react";
import L, { LatLngExpression } from "leaflet";

interface MapControl {
  map: L.Map | null;
  setMap: (map: L.Map | null) => void;
  flyTo: (position: LatLngExpression, zoom?: number) => void;
}

export function useMapControl(): MapControl {
  const [map, setMap] = useState<L.Map | null>(null);

  // 地図を指定の座標へスムーズに移動させる関数
  const flyTo = useCallback(
    (position: LatLngExpression, zoom?: number) => {
      map?.flyTo(position, zoom ?? map.getZoom());
    },
    [map],
  );

  return { map, setMap, flyTo };
}
