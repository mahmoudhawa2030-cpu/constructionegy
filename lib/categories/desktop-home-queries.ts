import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type DesktopHomeCategoryRow = {
  slug: string;
  label_ar: string;
  label_en: string | null;
  homepage_desktop_icon_key: string;
};

/** Active categories that have a desktop home icon (large-screen home cards). */
export async function fetchDesktopHomeCategories(
  client: SupabaseClient<Database>,
): Promise<DesktopHomeCategoryRow[]> {
  const { data, error } = await client
    .from("categories")
    .select("slug, label_ar, label_en, homepage_desktop_icon_key")
    .eq("is_active", true)
    .not("homepage_desktop_icon_key", "is", null)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  const out: DesktopHomeCategoryRow[] = [];
  for (const row of data) {
    const key = row.homepage_desktop_icon_key?.trim();
    if (!key) continue;
    out.push({
      slug: row.slug,
      label_ar: row.label_ar,
      label_en: row.label_en,
      homepage_desktop_icon_key: key,
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
