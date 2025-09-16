// APIサーバーに正常に接続できているかを確認するテスト用のエンドポイント
// src/app/api/ping-back/route.ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/libs/backendFetch";

export async function GET() {
  try {
    const r = await backendFetch("/health", { cache: "no-store" });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    // エラー内容をそのまま見たいので 502 で返す
    return NextResponse.json(
      {
        error: String(e),
        BACKEND_BASE: process.env.BACKEND_BASE,
        REQUIRE_ID_TOKEN: process.env.REQUIRE_ID_TOKEN,
      },
      { status: 502 },
    );
  }
}
