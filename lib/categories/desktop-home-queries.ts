import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { desktopCategoryIconPublicUrl } from "@/lib/supabase/desktop-category-icon-url";

export type DesktopHomeCategoryRow = {
  slug: string;
  label_ar: string;
  label_en: string | null;
  image_public_url: string;
};

/** Desktop home cards: enabled rows joined to active categories; order from card sort_order. */
export async function fetchDesktopHomeCategories(
  client: SupabaseClient<Database>,
): Promise<DesktopHomeCategoryRow[]> {
  const { data: cards, error: cErr } = await client
    .from("homepage_desktop_category_cards")
    .select("category_slug, image_storage_path, sort_order")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (cErr || !cards?.length) {
    return [];
  }

  const slugs = [...new Set(cards.map((c) => c.category_slug))];
  const { data: cats, error: catErr } = await client
    .from("categories")
    .select("slug, label_ar, label_en")
    .in("slug", slugs)
    .eq("is_active", true);

  if (catErr || !cats?.length) {
    return [];
  }

  const catMap = new Map(cats.map((c) => [c.slug, c]));
  const out: DesktopHomeCategoryRow[] = [];

  for (const card of cards) {
    const cat = catMap.get(card.category_slug);
    if (!cat) continue;
    out.push({
      slug: card.category_slug,
      label_ar: cat.label_ar,
      label_en: cat.label_en,
      image_public_url: desktopCategoryIconPublicUrl(card.image_storage_path),
    });
  }

  return out;
}

export function categoryTitleForLocale(
  row: Pick<DesktopHomeCategoryRow, "slug" | "label_ar" | "label_en">,
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return row.label_ar.trim();
  }
  const en = row.label_en?.trim();
  if (en) return en;
  return row.slug
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
