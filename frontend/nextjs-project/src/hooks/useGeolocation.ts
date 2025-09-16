"use client";

import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

// 許容する最大の誤差（メートル）。これより大きい誤差の位置情報は無視する。
const MAX_ACCURACY_METERS = 100;

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        // 精度の低い情報をフィルタリング
        if (position.coords.accuracy > MAX_ACCURACY_METERS) {
          console.warn(
            `Accuracy is too low (${position.coords.accuracy}m). Ignoring update.`,
          );
          // 誤差が大きすぎるので、stateを更新しない
          return;
        }

        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState((s) => ({ ...s, error: error.message, loading: false }));
      },
      {
        enableHighAccuracy: true,
        // 10秒待っても位置情報が取得できない場合はタイムアウト
        timeout: 10000, // 10秒
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}
