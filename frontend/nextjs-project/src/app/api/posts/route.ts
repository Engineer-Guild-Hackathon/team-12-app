// ./frontend/nextjs-project/src/app/api/posts/route.ts
import { backendFetch } from "@/libs/backendFetch";
import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const qLimit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const qOffset = parseInt(url.searchParams.get("offset") ?? "0", 10);
  const limit = Math.max(qLimit, 1);
  const offset = Math.max(qOffset, 0);

  const res = await backendFetch(
    `/api/posts?limit=${limit}&offset=${offset}`,
    // 認証ヘッダ等があればここで付与
    {
      method: "GET",
      cache: "no-store",
    },
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
  const res = await backendFetch(`/api/posts`, {
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
