import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("seo_posts")
    .select("id, seed_keyword, title, slug, content, meta_title, meta_description, category_slug, seo_score, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = (data ?? []).map((p) => ({
    id: p.id,
    seedKeyword: p.seed_keyword ?? "",
    title: p.title,
    slug: p.slug,
    content: p.content ?? "",
    metaTitle: p.meta_title ?? "",
    metaDescription: p.meta_description ?? "",
    category: p.category_slug,
    seoScore: p.seo_score ?? 0,
    wordCount: (p.content ?? "").split(" ").filter(Boolean).length,
    status: p.status,
    createdAt: p.created_at,
  }));

  return NextResponse.json(posts);
}
