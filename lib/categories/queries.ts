import { createClient } from "@/lib/supabase/server";

export type CategoryOption = {
  slug: string;
  label_ar: string;
  /** When subscription enforcement is on, posting here needs premium_listings (or all). */
  requires_subscription: boolean;
};

/** True if there is at least one active category that does not require a paid subscription. */
export async function hasActiveFreeListingCategory(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true)
    .eq("requires_subscription", false)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[categories] hasActiveFreeListingCategory", error.message);
    return true;
  }
  return !!data;
}

/** Active categories for listing create + default selects. */
export async function getActiveCategoriesForSelect(): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, label_ar, requires_subscription")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[categories]", error.message);
    return [];
  }
  return toCategoryOptions(data ?? []);
}

function toCategoryOptions(
  rows: { slug: string; label_ar: string; requires_subscription?: boolean | null }[],
): CategoryOption[] {
  return rows.map((r) => ({
    slug: r.slug,
    label_ar: r.label_ar,
    requires_subscription: Boolean(r.requires_subscription),
  }));
}

/**
 * Active categories plus any extra slugs (e.g. current listing’s inactive category for edit UI).
 */
export async function getCategoriesForListingForm(includeSlugs: string[] = []): Promise<CategoryOption[]> {
  const supabase = await createClient();
  const { data: active, error: e1 } = await supabase
    .from("categories")
    .select("slug, label_ar, sort_order, requires_subscription")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (e1) {
    console.error("[categories]", e1.message);
    return [];
  }

  const rows = [...(active ?? [])];
  const have = new Set(rows.map((r) => r.slug));
  const missing = includeSlugs.filter((s) => s && !have.has(s));

  if (missing.length > 0) {
    const { data: extras } = await supabase
      .from("categories")
      .select("slug, label_ar, sort_order, requires_subscription")
      .in("slug", missing);

    for (const r of extras ?? []) {
      rows.push(r);
    }
  }

  rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return toCategoryOptions(rows);
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
