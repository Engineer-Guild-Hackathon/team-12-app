import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
};

// 型をstringに限るためのエラー（想定はしていない）
if (!config.apiKey || !config.authDomain || !config.projectId) {
  throw new Error("Firebase config is not set");
}

export const app = getApps().length ? getApps()[0] : initializeApp(config);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);
