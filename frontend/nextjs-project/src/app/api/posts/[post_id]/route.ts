import { NextResponse } from "next/server";
import { fetchPostById } from "@/libs/postUtils";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ post_id: string }> },
) => {
  const { post_id } = await params;

  // ★ 実際の処理は共通関数に任せる
  const post = await fetchPostById(post_id);

  // 共通関数が失敗した（nullを返した）場合
  if (!post) {
    return NextResponse.json(
      { error: "Post not found or failed to fetch" },
      { status: 404 },
    );
  }

  // 成功した場合は、取得した投稿をクライアントに返す
  return NextResponse.json({ post });
};
