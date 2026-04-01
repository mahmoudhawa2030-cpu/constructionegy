import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type GuestHomepageSection = Pick<
  Database["public"]["Tables"]["homepage_sections"]["Row"],
  "id" | "slug" | "section_type" | "sort_order" | "title_ar" | "title_en" | "subtitle_ar" | "subtitle_en"
>;

export type GuestHomepageItem = Pick<
  Database["public"]["Tables"]["homepage_section_items"]["Row"],
  | "id"
  | "section_id"
  | "sort_order"
  | "title_ar"
  | "title_en"
  | "description_ar"
  | "description_en"
  | "href"
  | "icon_emoji"
  | "image_url"
  | "badge_count"
  | "badge_label_ar"
  | "badge_label_en"
>;

export async function fetchGuestHomepageContent(client: SupabaseClient<Database>): Promise<{
  sections: GuestHomepageSection[];
  itemsBySectionId: Map<string, GuestHomepageItem[]>;
}> {
  const { data: sections, error: sErr } = await client
    .from("homepage_sections")
    .select("id, slug, section_type, sort_order, title_ar, title_en, subtitle_ar, subtitle_en")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (sErr || !sections?.length) {
    return { sections: [], itemsBySectionId: new Map() };
  }

  const ids = sections.map((s) => s.id);
  const { data: items } = await client
    .from("homepage_section_items")
    .select(
      "id, section_id, sort_order, title_ar, title_en, description_ar, description_en, href, icon_emoji, image_url, badge_count, badge_label_ar, badge_label_en",
    )
    .in("section_id", ids)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  const itemsBySectionId = new Map<string, GuestHomepageItem[]>();
  for (const s of sections) {
    itemsBySectionId.set(s.id, []);
  }
  for (const it of items ?? []) {
    const row = itemsBySectionId.get(it.section_id);
    if (row) {
      row.push(it);
    }
  }

  return { sections, itemsBySectionId };
}
