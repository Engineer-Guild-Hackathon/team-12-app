import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_BASE ?? "http://back-server:5000";

// v1–v5対応の簡易UUIDチェック
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET = async (
  _req: Request,
  { params }: { params: { post_id: string } }
) => {
  const postId = params.post_id;

  // UUIDでなければ 400 を返す（バックエンドにリクエストしない）
  if (!UUID_RE.test(postId)) {
    return NextResponse.json(
      { error: "post_id は UUID 形式で指定してください" },
      { status: 400 }
    );
  }

  const res = await fetch(`${BACKEND_BASE}/api/posts/${postId}`, {
    // 認証ヘッダ等があればここで付与
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
