// src/libs/backendFetch.ts
import { GoogleAuth } from "google-auth-library";

const BASE = (process.env.BACKEND_BASE ?? "http://back-server:5000").replace(
  /\/+$/,
  "",
);
const REQUIRE_ID_TOKEN =
  String(process.env.REQUIRE_ID_TOKEN ?? "").toLowerCase() === "true";
const AUDIENCE = (process.env.BACKEND_AUDIENCE ?? BASE).replace(/\/+$/, "");

/** Headers 風判定（.get を持っているかで判断） */
function isHeadersLike(x: unknown): x is Headers {
  return (
    !!x &&
    typeof x === "object" &&
    "get" in x &&
    typeof (x as { get: unknown }).get === "function"
  );
}

/** 送信ヘッダは必要最小限のみ（認証ヘッダはここでは付けない） */
function pickHeaders(h: HeadersInit | undefined): Headers {
  const src = new Headers(h);
  const dst = new Headers();
  const allow = new Set([
    "content-type",
    "accept",
    "accept-language",
    "x-request-id",
  ]);
  src.forEach((v, k) => {
    if (allow.has(k.toLowerCase())) dst.set(k, v);
  });
  return dst;
}

async function idTokenHeaderFor(
  targetUrl: string,
): Promise<Record<string, string>> {
  if (!REQUIRE_ID_TOKEN) return {};
  const auth = new GoogleAuth();
  // Cloud Run のサービス間認証は audience=サービスURL（末尾スラ無し）
  const client = await auth.getIdTokenClient(AUDIENCE);
  const got = await client.getRequestHeaders(targetUrl); // 環境やバージョンで型が異なる場合に備える

  let token: string | null | undefined;
  if (isHeadersLike(got)) {
    token = got.get("authorization") ?? got.get("Authorization");
  } else {
    const rec = got as Record<string, string>;
    token = rec["authorization"] ?? rec["Authorization"];
  }
  return token ? { Authorization: token } : {};
}

/**
 * バックエンドに対する安全なフェッチ（必要に応じてIDトークン付与）
 * @param path 先頭スラッシュで始まるパス（例: "/api/posts"）
 * @param init fetch init（cache を渡せば尊重、無指定なら "no-store"）
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  // path は "/..." 前提。BASE の末尾スラは除去済み
  const url = `${BASE}${path}`;
  const method = (init?.method ?? "GET").toUpperCase();
  const cache = init?.cache ?? "no-store";

  const headers = pickHeaders(init?.headers);
  const signed = await idTokenHeaderFor(url);
  if (signed.Authorization) headers.set("Authorization", signed.Authorization);

  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    if (init?.body instanceof FormData) {
      body = init.body; // Node/Next の FormData をそのまま転送
    } else if (init?.body) {
      body = init.body;
    }
  }

  return fetch(url, {
    ...init,
    method,
    headers,
    body,
    cache,
    redirect: "manual",
  });
}
