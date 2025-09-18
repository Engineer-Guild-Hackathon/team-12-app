import { backendFetch } from "@/libs/backendFetch";
import { NextResponse } from "next/server";

export const GET = async () => {
  const res = await backendFetch(`/api/posts/recent`, {
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
