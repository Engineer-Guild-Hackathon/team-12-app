import { create } from "zustand";

// マップに渡す情報の型を定義
interface MapTarget {
  postId: string;
  lat: number;
  lng: number;
  useSavedZoom?: boolean;
}

interface MapView {
  center: [number, number];
  zoom: number;
}

// ストアのStateとActionの型を定義
interface MapState {
  initialTarget: MapTarget | null;
  setInitialTarget: (target: MapTarget) => void;
  clearInitialTarget: () => void;
  mapView: MapView | null;
  setMapView: (view: MapView | null) => void;
}

// ストアを作成
export const useMapStore = create<MapState>((set) => ({
  // 初期状態
  initialTarget: null,
  // Stateを更新するAction
  setInitialTarget: (target) => set({ initialTarget: target }),
  // StateをリセットするAction
  clearInitialTarget: () => set({ initialTarget: null }),
  mapView: null,
  setMapView: (view) => set({ mapView: view }),
}));
