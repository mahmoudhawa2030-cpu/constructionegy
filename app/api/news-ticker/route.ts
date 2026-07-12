import { NextRequest, NextResponse } from "next/server";

import { getActiveNewsTicker } from "@/lib/news-ticker/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const surfaceParam = req.nextUrl.searchParams.get("surface");
  const surface = surfaceParam === "web" ? "web" : "mobile";
  const pathname = req.nextUrl.searchParams.get("pathname") || "/";
  const locale = req.nextUrl.searchParams.get("locale") === "ar" ? "ar" : "en";

  try {
    const supabase = await createClient();
    const ticker = await getActiveNewsTicker(supabase, { surface, pathname, locale });
    if (!ticker) return NextResponse.json(null);
    return NextResponse.json(ticker, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
