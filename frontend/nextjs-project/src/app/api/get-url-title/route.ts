import { getTitleFromUrl } from "@/libs/urlUtils"; // 作成した関数をインポート
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // 共通関数を呼び出すだけ
  const title = await getTitleFromUrl(url);

  return NextResponse.json({ title });
}
