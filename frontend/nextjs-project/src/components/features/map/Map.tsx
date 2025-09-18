"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { useMapControl } from "@/hooks/useMapControl";
import { Post } from "@/types/post";
import RecenterButton from "./RecenterButton";
import { Box } from "@mui/material";
import { useEffect, useCallback, useRef } from "react";
import PostMarker from "./PostMarker";
import { useGeolocation } from "@/hooks/useGeolocation";
import CurrentUserMarker from "./CurrentUserMarker";
import MapViewController from "./MapViewController";
import MarkerClusterGroup from "react-leaflet-markercluster";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート
import { useMapStore } from "@/stores/mapStore";

interface MapProps {
  posts: Post[];
  onMarkerClick: (post: Post) => void;
  selectedPost: Post | null;
  setSelectedPost: (post: Post) => void;
  isFollowing: boolean;
  setIsFollowing: (isFollowing: boolean) => void;
}

export default function Map({
  posts,
  onMarkerClick,
  selectedPost,
  setSelectedPost,
  isFollowing,
  setIsFollowing,
}: MapProps) {
  const { latitude, longitude, loading: geolocationLoading } = useGeolocation();
  const { map, setMap, flyTo } = useMapControl();

  const { mapView, setMapView } = useMapStore();
  console.log(mapView);
  const { initialTarget, clearInitialTarget } = useMapStore();

  const isMapInitialized = useRef(false);

  useEffect(() => {
    if (!map) return;

    // 地図の移動またはズームが終わったときに呼ばれる関数
    const handleMapChange = () => {
      if (!isFollowing) {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setMapView({ center: [center.lat, center.lng], zoom });
      }
    };

    // イベントリスナーを登録
    map.on("moveend", handleMapChange);
    map.on("zoomend", handleMapChange);

    // コンポーネントがアンマウントされるときにイベントリスナーを解除
    return () => {
      map.off("moveend", handleMapChange);
      map.off("zoomend", handleMapChange);
    };
  }, [map, setMapView, isFollowing]);

  useEffect(() => {
    // mapインスタンスがない、または現在地読み込み中、または既に初期化済みの場合は何もしない
    if (!map || geolocationLoading || isMapInitialized.current) {
      return;
    }

    // 初期化処理は一度しか実行しないようにフラグを立てる
    isMapInitialized.current = true;

    // Zustandに保存されたmapViewがあれば、その位置とズームを復元
    if (mapView) {
      // setViewはアニメーションなしで瞬時に地図を移動させる
      map.setView(mapView.center, mapView.zoom);
    }
    // 保存されたmapViewがなく、現在地が取得できていれば、現在地を初期位置にする
    else if (latitude && longitude) {
      map.setView([latitude, longitude], 16);
    }
  }, [map, geolocationLoading, mapView, latitude, longitude]);

  useEffect(() => {
    if (initialTarget && posts.length > 0 && map) {
      // 1. まず最初に追従モードをOFFにする。これにより追従機能が邪魔しなくなる
      setIsFollowing(false);

      // 2. 地図の移動アニメーションが終わった後に実行する処理を定義
      const onMoveAnimationEnd = () => {
        // 3. アニメーション完了後、Zustandのターゲット情報をクリアする
        clearInitialTarget();

        // 4.【重要】一度使ったイベントリスナーは必ず削除し、メモリリークを防ぐ
        map.off("moveend", onMoveAnimationEnd);
      };

      // 5. 地図が移動を完了した時のイベント（moveend）を一度だけ監視する
      map.on("moveend", onMoveAnimationEnd);

      // 6. 投稿の場所へ移動アニメーションを開始する
      flyTo([initialTarget.lat, initialTarget.lng], 18);

      // 7. 該当の投稿を選択状態にする
      const postToSelect = posts.find(
        (p) => p.post_id === initialTarget.postId,
      );
      if (postToSelect) {
        setSelectedPost(postToSelect);
      }
    }
    // 依存配列に`map`と`setIsFollowing`を追加
  }, [
    initialTarget,
    posts,
    map,
    flyTo,
    setSelectedPost,
    clearInitialTarget,
    setIsFollowing,
  ]);

  const handleRecenter = () => {
    if (latitude && longitude) {
      flyTo([latitude, longitude], 16);
      setIsFollowing(true);
      setMapView(null);
    }
  };

  const handleManualDrag = useCallback(() => {
    setIsFollowing(false);
  }, [setIsFollowing]);

  useEffect(() => {
    if (!map) return;
    map.on("dragstart", handleManualDrag);
    return () => {
      map.off("dragstart", handleManualDrag);
    };
  }, [map, handleManualDrag]);

  // アニメーションとマーカーアイコンのスタイルを<head>に注入します
  useEffect(() => {
    const styleId = "map-marker-styles";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.innerHTML = `
      /* クラスターの基本スタイル */
      .marker-cluster {
        background-clip: padding-box;
        border-radius: 50%;
        color: #fff; /* 中の数字の色 */
        font-weight: bold;
        font-size: 12px;
        background-color: #85934E;
        width: 40px;
        height: 40px;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .marker-cluster div {
        background-color: rgb(255, 255, 255, 0);
        border-radius: 50%;
        margin-left: 0px;
        margin-top: 0px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .custom-marker-default,
      .custom-marker-selected {
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        border: none; /* Leafletのデフォルトの枠線を消す */
      }

      /* 通常時のマーカーアイコン */
      .custom-marker-default {
        background-image: url('/marker.svg');
      }

      /* 選択時のマーカーアイコン */
      .custom-marker-selected {
        background-image: url('/selected-marker.svg');
      }
  `;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  if (geolocationLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center", // 横方向の中央揃え
          alignItems: "center", // 縦方向の中央揃え
          height: "100%", // 親要素の高さ全体を使う
          width: "100%", // 親要素の幅全体を使う
        }}
      >
        <LeafyLoader />
      </Box>
    );
  }

  const currentPosition: [number, number] | null =
    latitude && longitude ? [latitude, longitude] : null;

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={[43.068, 141.35]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        ref={setMap}
        worldCopyJump={true}
        minZoom={3}
        maxZoom={20}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
        />

        {currentPosition && (
          <MapViewController
            position={currentPosition}
            isFollowing={isFollowing}
          />
        )}

        <MarkerClusterGroup
          polygonOptions={{
            color: "#85934E",
            weight: 2,
            opacity: 0.8,
            fillColor: "#B2BE83",
            fillOpacity: 0.3,
          }}
          maxClusterRadius={15}
          disableClusteringAtZoom={18}
        >
          {posts.map((post) => (
            <PostMarker
              key={post.post_id}
              post={post}
              isSelected={selectedPost?.post_id === post.post_id}
              onMarkerClick={onMarkerClick}
            />
          ))}
        </MarkerClusterGroup>

        {currentPosition && <CurrentUserMarker position={currentPosition} />}

        <RecenterButton onClick={handleRecenter} />
      </MapContainer>
    </Box>
  );
}
