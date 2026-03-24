import { createClient } from "@/lib/supabase/server";

export type CategoryOption = {
  slug: string;
  label_ar: string;
};

/** Active categories for listing create + default selects. */
export async function getActiveCategoriesForSelect(): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, label_ar")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[categories]", error.message);
    return [];
  }
  return (data ?? []) as CategoryOption[];
}

/**
 * Active categories plus any extra slugs (e.g. current listing’s inactive category for edit UI).
 */
export async function getCategoriesForListingForm(includeSlugs: string[] = []): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data: active, error: e1 } = await supabase
    .from("categories")
    .select("slug, label_ar, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (e1) {
    console.error("[categories]", e1.message);
    return [];
  }

  const rows = [...(active ?? [])];
  const have = new Set(rows.map((r) => r.slug));
  const missing = includeSlugs.filter((s) => s && !have.has(s));
  if (missing.length === 0) {
    return rows.map(({ slug, label_ar }) => ({ slug, label_ar }));
  }

  const { data: extras } = await supabase
    .from("categories")
    .select("slug, label_ar, sort_order")
    .in("slug", missing);

  for (const r of extras ?? []) {
    rows.push(r);
  }

  rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return rows.map(({ slug, label_ar }) => ({ slug, label_ar }));
}

/** Slug → Arabic label for all categories (active + inactive) for display. */
export async function getCategoryLabelMap(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("slug, label_ar");

  if (error) {
    console.error("[categories]", error.message);
    return {};
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.slug] = row.label_ar;
  }
  return map;
}

export async function isActiveCategorySlug(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return !!data;
}

/** Any row (active or not) — for validating listing updates. */
export async function categorySlugExists(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("slug").eq("slug", slug).maybeSingle();

  return !!data;
}
