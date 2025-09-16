// ./frontend/nextjs-project/src/app/api/images/[img_id]/route.ts
import { NextResponse } from "next/server";
import { backendFetch } from "@/libs/backendFetch";

// v1–v5 UUID の簡易チェック
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET = async (
  _req: Request,
  ctx: { params: Promise<{ img_id: string }> },
) => {
  const { img_id } = await ctx.params; // ← unwrap (Next.js 15系)
  if (!UUID_RE.test(img_id)) {
    return NextResponse.json(
      { error: "img_id は UUID 形式で指定してください" },
      { status: 400 },
    );
  }

  const res = await backendFetch(`/api/images/${img_id}`, {
    // 認証ヘッダを付ける場合はここで追加
    method: "GET",
    cache: "no-store",
  });

  const body = await res.text(); // JSON想定
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
