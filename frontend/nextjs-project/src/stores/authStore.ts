"use client";

import { create } from "zustand";
import { auth } from "@/libs/firebase.client";
import {
  onIdTokenChanged,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";

// このキーが localStorage にあれば、認証済み状態
const AUTH_CACHE_KEY = "auth-cached-flag";

function setCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_CACHE_KEY, "true");
  } catch {
    /* noop */
  }
}

function removeCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    /* noop */
  }
}

function hasCache(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_CACHE_KEY) !== null;
  } catch {
    return false;
  }
}

export type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  initialized: boolean;
  initializing: boolean;
  error: "token_fetch_failed" | "signout_failed" | undefined;
  isLoginGuideModalOpen: boolean;

  // 初期化を一度だけ実行する
  init: () => void;
  // 最新のIDトークンを取得（必要ならforceRefreshも可能）
  getToken: (opts?: { forceRefresh?: boolean }) => Promise<string | null>;
  signOut: () => Promise<void>;
  handleLoginGuideModal: (newOpen: boolean) => void;

  _unsubAuth: (() => void) | null;
  _storageHandler: ((e: StorageEvent) => void) | null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "idle",
  initialized: false,
  initializing: false,
  error: undefined,
  isLoginGuideModalOpen: false,
  _unsubAuth: null,
  _storageHandler: null,

  init: () => {
    const s = get();
    if (s.initialized || s.initializing) return;

    set({ initializing: true });

    // キャッシュがあれば、認証済み状態の表示にする
    if (hasCache()) {
      set({
        initialized: true,
        initializing: false,
        status: "authenticated",
      });
    }

    // 1) auth の状態とトークン更新を一手に担う
    const unsub = onIdTokenChanged(auth, (user) => {
      if (user) {
        setCache();
      } else {
        removeCache();
      }

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
      if (e.key === AUTH_CACHE_KEY && e.newValue === null) {
        // 別タブでログアウト
        try {
          set({ user: null, status: "unauthenticated" });
        } catch {
          /* noop */
        }
      }

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
      removeCache();
      set({ user: null, status: "unauthenticated", error: undefined });
    } catch (err) {
      console.error("[auth.signOut] failed:", err);
      set({ error: "signout_failed" });
      // 失敗しても UI 的には未ログイン扱いにしてよければ以下を残す
      // set({ user: null, status: "unauthenticated" });
    }
  },

  handleLoginGuideModal: (newOpen) => set({ isLoginGuideModalOpen: newOpen }),
}));
