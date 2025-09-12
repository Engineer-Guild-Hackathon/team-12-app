import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://back-server:5000";

/**
 * 期待する入力:
 * - form-data: file(画像), question(文字列) など
 * 返却:
 * - バックエンドの JSON をそのまま透過
 */
export const POST = async (req: Request) => {
  // フォームを読み取り（Body を消費）
  const form = await req.formData();

  // バックエンドへそのまま転送
  const res = await fetch(`${BACKEND_BASE}/api/image_analyze`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  const body = await res.text(); // 画像ではなく JSON 想定
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
