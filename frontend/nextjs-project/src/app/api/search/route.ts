import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/libs/backendFetch";

// GET /api/search?q=...&limit=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const limit = searchParams.get("limit");

  // バリデーション（最低限）: q は必須
  if (!q) {
    return NextResponse.json(
      { error: "検索クエリ 'q' が必要です" },
      { status: 400 },
    );
  }

  // limitのバリデーション: 指定されている場合のみチェック
  if (limit !== null) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum <= 0 || !Number.isInteger(limitNum)) {
      return NextResponse.json(
        { error: "limitは1以上の整数で指定してください" },
        { status: 400 },
      );
    }
  }

  const qs = new URLSearchParams();
  qs.set("q", q);
  if (limit) qs.set("limit", limit);

  try {
    const resp = await backendFetch(`/api/search?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const text = await resp.text();
    // backendからのボディはそのまま返す（JSON前提）
    return new NextResponse(text, {
      status: resp.status,
      headers: {
        "content-type": resp.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "検索に失敗しました", detail: message },
      { status: 500 },
    );
  }
}
