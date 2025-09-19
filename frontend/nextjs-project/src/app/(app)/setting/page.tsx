import { Metadata } from "next";
import SettingClient from "./client";

export const metadata: Metadata = {
  title: "設定 - holo",
  // ★ 検索エンジンにインデックスさせないための重要な設定
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingPage() {
  return <SettingClient />;
}
