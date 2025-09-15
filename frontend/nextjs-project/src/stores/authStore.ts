"use client";

import { create } from "zustand";
import { auth } from "@/libs/firebase.client";
import {
  onIdTokenChanged,
  //   onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";

export type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  initialized: boolean;
  initializing: boolean;
  // 初期化を一度だけ実行する
  init: () => void;
  // 最新のIDトークンを取得（必要ならforceRefreshも可能）
  getToken: (opts?: { forceRefresh?: boolean }) => Promise<string | null>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  initialized: false,
  initializing: false,
  error: undefined,

  init: () => {
    const s = get();
    if (s.initialized || s.initializing) return;

    set({ initializing: true });

    // 1) auth の状態とトークン更新を一手に担う
    const unsub = onIdTokenChanged(auth, (user) => {
      set({
        user,
        status: user ? "authenticated" : "unauthenticated",
        initializing: false,
        initialized: true,
        error: undefined,
      });
    });

    // 2) 複数タブ同期
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("firebase:authUser")) {
        // onIdTokenChanged が走る想定。エラーの時のconsole用で残す
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }

    set({ _unsubAuth: unsub, _storageHandler: onStorage });
  },

  dispose: () => {
    const { _unsubAuth, _storageHandler } = get();
    try {
      _unsubAuth?.();
    } catch {
      /* noop */
    }
    if (_storageHandler && typeof window !== "undefined") {
      window.removeEventListener("storage", _storageHandler);
    }
    set({
      _unsubAuth: null,
      _storageHandler: null,
      initialized: false,
      initializing: false,
      // 状態は維持してもいいし、クリアしてもよい。用途に応じて↓を使う
      // user: null,
      // status: "unknown",
    });
  },

  getToken: async ({ forceRefresh = false } = {}) => {
    const user = get().user ?? auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken(forceRefresh);
    } catch (err) {
      console.error("[auth.getToken] failed:", err);
      set({ error: "token_fetch_failed" });
      return null;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, status: "unauthenticated", error: undefined });
    } catch (err) {
      console.error("[auth.signOut] failed:", err);
      set({ error: "signout_failed" });
      // 失敗しても UI 的には未ログイン扱いにしてよければ以下を残す
      // set({ user: null, status: "unauthenticated" });
    }
  },
}));
