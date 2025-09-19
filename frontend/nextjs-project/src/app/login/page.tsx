import { Metadata } from "next";
import LoginClient from "./client";

export const metadata: Metadata = {
  title: "holo - AIカメラと問いで作る新しい散歩地図",
  description:
    "散歩×地図×AIカメラで、日常の「どうして？」を見つけにいくサービスです。あなたの「はっけん」をマップに記録・共有しましょう。",
};

export default function LoginPage() {
  return <LoginClient />;
}
