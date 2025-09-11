"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import ReactDOMServer from "react-dom/server";
import CustomMarkerIcon from "./CustomMarkerIcon";

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

// 2. カスタムマーカーのアイコンを生成する関数
const createCustomIcon = () => {
  return L.divIcon({
    html: ReactDOMServer.renderToString(<CustomMarkerIcon />),
    className: "custom-marker-icon", // スタイル調整用のクラス名
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

export default function Map() {
  const initialPosition: LatLngExpression = [43.064, 141.35];

  return (
    <>
      {/* 3. divIconのデフォルトスタイルを上書きするためのCSS */}
      <style>{`
        .custom-marker-icon {
          background: none;
          border: none;
        }
      `}</style>
      <MapContainer
        center={initialPosition}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 4. 発見データをループしてカスタムマーカーを表示 */}
        {discoveries.map((discovery) => (
          <Marker
            key={discovery.id}
            position={discovery.position}
            icon={createCustomIcon()}
          >
            <Popup>{discovery.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
