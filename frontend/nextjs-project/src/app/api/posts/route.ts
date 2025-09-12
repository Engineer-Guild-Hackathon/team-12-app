import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE ?? "http://back-server:5000";

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const qLimit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const qOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Math.max(qLimit, 1);
  const offset = Math.max(qOffset, 0);

  const res = await fetch(
    `${BACKEND_BASE}/api/posts?limit=${limit}&offset=${offset}`,
    // 認証ヘッダ等があればここで付与
    { cache: "no-store" }
  );

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
};

export const POST = async (req: Request) => {
  const json = await req.json().catch(() => ({}));
  const res = await fetch(`${BACKEND_BASE}/api/posts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(json),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
