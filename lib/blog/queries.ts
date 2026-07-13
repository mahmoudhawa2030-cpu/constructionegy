import { createClient } from "@/lib/supabase/server";

export type SeoPostRow = {
  id: string;
  category_slug: string;
  seed_keyword: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  cover_image: string | null;
  cover_image_alt: string | null;
  status: string;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
  faq_schema: Record<string, unknown> | null;
  howto_schema: Record<string, unknown> | null;
  noindex: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
};

export type CategoryRow = {
  slug: string;
  label_ar: string;
  label_en: string | null;
  is_active: boolean;
  seo_title_ar: string | null;
  seo_title_en: string | null;
  seo_description_ar: string | null;
  seo_description_en: string | null;
  intro_ar: string | null;
  intro_en: string | null;
};

const CATEGORY_SELECT =
  "slug, label_ar, label_en, is_active, seo_title_ar, seo_title_en, seo_description_ar, seo_description_en, intro_ar, intro_en";

const POST_SELECT =
  "id, category_slug, seed_keyword, title, slug, content, meta_title, meta_description, cover_image, cover_image_alt, status, publish_at, created_at, updated_at, faq_schema, howto_schema, noindex, og_title, og_description, og_image";

/** Decode path segments that may still be percent-encoded (Arabic slugs). */
export function decodePathSegment(value: string): string {
  if (!value) return value;
  let out = value;
  // Decode up to twice in case of double-encoding (%25xx)
  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9A-Fa-f]{2}/.test(out)) break;
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      break;
    }
  }
  // NFC so Arabic URL forms match DB storage
  try {
    return out.normalize("NFC");
  } catch {
    return out;
  }
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select(CATEGORY_SELECT)
    .eq("slug", decodePathSegment(slug))
    .maybeSingle();
  return (data as CategoryRow) ?? null;
}

export async function getPublishedPostsByCategory(
  categorySlug: string,
  limit = 12,
): Promise<SeoPostRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_posts")
    .select(POST_SELECT)
    .eq("category_slug", decodePathSegment(categorySlug))
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as SeoPostRow[]) ?? [];
}

export async function getPublishedPost(
  categorySlug: string,
  slug: string,
): Promise<SeoPostRow | null> {
  const supabase = await createClient();
  const cat = decodePathSegment(categorySlug);
  const postSlug = decodePathSegment(slug);
  const { data } = await supabase
    .from("seo_posts")
    .select(POST_SELECT)
    .eq("category_slug", cat)
    .eq("slug", postSlug)
    .eq("status", "published")
    .maybeSingle();
  return (data as SeoPostRow) ?? null;
}

export async function getAllPublishedPosts(limit = 1000): Promise<SeoPostRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("seo_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as SeoPostRow[]) ?? [];
}
