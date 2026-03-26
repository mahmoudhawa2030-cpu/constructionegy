import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryAdminRow = CategoryRow & { listing_count: number };

export async function getAllCategoriesForAdmin(): Promise<CategoryAdminRow[]> {
  const supabase = await createClient();
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (catErr) {
    console.error("[categories]", catErr.message);
    return [];
  }
  if (!categories?.length) {
    return [];
  }

  const { data: listingRows, error: listErr } = await supabase.from("listings").select("category");
  if (listErr) {
    console.error("[categories] listing counts", listErr.message);
  }

  const countBySlug = new Map<string, number>();
  for (const row of listingRows ?? []) {
    const slug = row.category;
    countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
  }

  return categories.map((c) => ({
    ...c,
    listing_count: countBySlug.get(c.slug) ?? 0,
  }));
}
