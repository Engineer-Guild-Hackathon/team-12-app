import { NextResponse } from "next/server";
import { fetchImageRecordById } from "@/libs/imageUtils";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ img_id: string }> },
) => {
  const { img_id } = await params;

  // 実際の処理は共通関数に任せる
  const imageRecord = await fetchImageRecordById(img_id);

  if (!imageRecord) {
    return NextResponse.json(
      { error: "Image not found or failed to fetch URL" },
      { status: 404 },
    );
  }

  return NextResponse.json({ image: imageRecord });
};
