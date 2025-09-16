// ./frontend/nextjs-project/src/app/api/posts/[post_id]/route.ts
import { backendFetch } from "@/libs/backendFetch";
import { NextRequest, NextResponse } from "next/server";

// v1–v5対応の簡易UUIDチェック
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> },
) => {
  const { post_id } = await params;

  // UUIDでなければ 400 を返す（バックエンドにリクエストしない）
  if (!UUID_RE.test(post_id)) {
    return NextResponse.json(
      { error: "post_id は UUID 形式で指定してください" },
      { status: 400 },
    );
  }

  const res = await backendFetch(`/api/posts/${post_id}`, {
    // 認証ヘッダ等があればここで付与
    method: "GET",
    cache: "no-store",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
};
