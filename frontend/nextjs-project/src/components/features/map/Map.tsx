"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import RecenterButton from "./RecenterButton";
import { useMapControl } from "@/hooks/useMapControl";
import { createCustomIcon } from "@/utils/createCustomIcon";

// マップインスタンスを取得するための、目に見えないコンポーネント
function MapController({ setMap }: { setMap: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}

// 北海道大学内の、ピンポイントで分かりやすいランドマークのデータ
export const discoveries = [
  {
    id: 1,
    // クラーク像
    position: [43.071311, 141.343841] as LatLngExpression,
    title: "クラーク像",
    image: "https://placehold.co/40x40/76A0C8/FFFFFF?text=像",
  },
  {
    id: 2,
    position: [43.076167, 141.339033] as LatLngExpression,
    title: "情エレ棟",
    image: "https://placehold.co/40x40/A0C876/FFFFFF?text=木",
  },
];

export default function Map() {
  const { position, isLoading, setMap, handleRecenter } = useMapControl();

  if (isLoading) {
    return <p>現在地を取得しています...</p>;
  }

  return (
    <>
      <style>{`
        .custom-marker-icon {
          background: none;
          border: none;
        }
      `}</style>
      <MapContainer
        center={position}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 現在地のマーカー */}
        <Marker key={0} position={position} icon={createCustomIcon()}>
          <Popup>現在地</Popup>
        </Marker>

        {/* 発見データをループしてカスタムマーカーを表示 */}
        {discoveries.map((discovery) => (
          <Marker
            key={discovery.id}
            position={discovery.position}
            icon={createCustomIcon()}
          >
            <Popup>{discovery.title}</Popup>
          </Marker>
        ))}

        <MapController setMap={setMap} />
        <RecenterButton onClick={handleRecenter} />
      </MapContainer>
    </>
  );
}
