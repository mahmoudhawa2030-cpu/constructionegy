import { NextResponse } from "next/server";

/**
 * IndexNow key file endpoint. Content must be the raw key string.
 * Configure INDEXNOW_KEY in env; submitIndexNow uses this as keyLocation.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return new NextResponse("IndexNow not configured", { status: 404 });
  }
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
