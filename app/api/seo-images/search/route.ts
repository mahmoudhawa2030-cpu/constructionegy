import { NextRequest, NextResponse } from "next/server";

import { searchStockImagesForKeyword } from "@/lib/seo/stock-images";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;
export const revalidate = 0;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase };
}

/**
 * GET /api/seo-images/search?q=ايجار+سقالات&count=9
 * Arabic keywords are mapped/translated to English, then searched on Openverse.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth && auth.error) return auth.error;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const count = Math.min(
    20,
    Math.max(1, Number(req.nextUrl.searchParams.get("count") || "9") || 9),
  );

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const { images, englishQuery } = await searchStockImagesForKeyword(q, count, q);
    return NextResponse.json({
      images,
      englishQuery,
      query: q,
      count: images.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
