import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type WebHomeSectionSlug =
  | "web_hero_slider"
  | "web_categories_strip"
  | "web_flash_deals"
  | "web_trending"
  | "web_promo_banners"
  | "web_featured_suppliers";

export const WEB_HOME_SECTION_SLUGS: WebHomeSectionSlug[] = [
  "web_hero_slider",
  "web_categories_strip",
  "web_flash_deals",
  "web_trending",
  "web_promo_banners",
  "web_featured_suppliers",
];

type ItemRow = Database["public"]["Tables"]["homepage_section_items"]["Row"];
type SectionRow = Database["public"]["Tables"]["homepage_sections"]["Row"];

export type WebHomeSection = SectionRow & {
  items: WebHomeItem[];
};

export type WebHomeItem = ItemRow & {
  /** Joined listing data when item.listing_id is set (flash_deals, trending). */
  listing?: {
    id: string;
    title: string;
    price: number;
    price_unit: string | null;
    images: string[] | null;
    location: string | null;
    view_count: number | null;
    category: string;
  } | null;
  /** Joined supplier profile when item.supplier_id is set (featured_suppliers). */
  supplier?: {
    id: string;
    full_name: string | null;
    legal_company_name: string | null;
    avatar_url: string | null;
    business_verification_status: string | null;
  } | null;
};

export type WebHomeData = Record<WebHomeSectionSlug, WebHomeSection | null>;

export async function getWebHomeData(
  client: SupabaseClient<Database>,
): Promise<WebHomeData> {
  // 1. Fetch all 6 enabled sections by slug
  const { data: sections } = await client
    .from("homepage_sections")
    .select("*")
    .in("slug", WEB_HOME_SECTION_SLUGS)
    .eq("enabled", true);

  const sectionsBySlug = new Map<string, SectionRow>();
  for (const s of sections ?? []) sectionsBySlug.set(s.slug, s);

  const sectionIds = (sections ?? []).map((s) => s.id);
  if (sectionIds.length === 0) {
    return emptyData();
  }

  // 2. Fetch all enabled items for these sections in one query
  const { data: items } = await client
    .from("homepage_section_items")
    .select("*")
    .in("section_id", sectionIds)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  const allItems = items ?? [];

  // 3. Batch-fetch referenced listings + suppliers in parallel
  const listingIds = Array.from(
    new Set(allItems.map((i) => i.listing_id).filter((v): v is string => Boolean(v))),
  );
  const supplierIds = Array.from(
    new Set(allItems.map((i) => i.supplier_id).filter((v): v is string => Boolean(v))),
  );

  const [listingsRes, suppliersRes] = await Promise.all([
    listingIds.length > 0
      ? client
          .from("listings")
          .select("id, title, price, price_unit, images, location, view_count, category")
          .in("id", listingIds)
      : Promise.resolve({ data: [] as Array<Database["public"]["Tables"]["listings"]["Row"]> }),
    supplierIds.length > 0
      ? client
          .from("profiles")
          .select("id, full_name, legal_company_name, avatar_url, business_verification_status")
          .in("id", supplierIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            full_name: string | null;
            legal_company_name: string | null;
            avatar_url: string | null;
            business_verification_status: string | null;
          }>,
        }),
  ]);

  const listingMap = new Map<string, WebHomeItem["listing"]>();
  for (const l of (listingsRes.data ?? []) as Array<{
    id: string;
    title: string;
    price: number;
    price_unit: string | null;
    images: string[] | null;
    location: string | null;
    view_count: number | null;
    category: string;
  }>) {
    listingMap.set(l.id, {
      id: l.id,
      title: l.title,
      price: l.price,
      price_unit: l.price_unit,
      images: l.images,
      location: l.location,
      view_count: l.view_count,
      category: l.category,
    });
  }

  const supplierMap = new Map<string, WebHomeItem["supplier"]>();
  for (const p of suppliersRes.data ?? []) {
    supplierMap.set(p.id, p);
  }

  // 4. Group items by section_id and attach joined entities
  const itemsBySection = new Map<string, WebHomeItem[]>();
  for (const it of allItems) {
    const enriched: WebHomeItem = {
      ...it,
      listing: it.listing_id ? (listingMap.get(it.listing_id) ?? null) : null,
      supplier: it.supplier_id ? (supplierMap.get(it.supplier_id) ?? null) : null,
    };
    const arr = itemsBySection.get(it.section_id) ?? [];
    arr.push(enriched);
    itemsBySection.set(it.section_id, arr);
  }

  // 5. Build result keyed by section slug
  const result = emptyData();
  for (const slug of WEB_HOME_SECTION_SLUGS) {
    const section = sectionsBySlug.get(slug);
    if (!section) continue;
    result[slug] = { ...section, items: itemsBySection.get(section.id) ?? [] };
  }
  return result;
}

/** A homepage section whose slug matches `web_cat_{categorySlug}`. */
export type CategoryListingSection = SectionRow & {
  categorySlug: string;
  listings: {
    id: string;
    title: string;
    price: number;
    price_unit: string | null;
    images: string[] | null;
    location: string | null;
    view_count: number | null;
  }[];
};

/** Fetch all enabled category-listing sections (slug prefix `web_cat_`) and their live listings. */
export async function getCategoryListingSections(
  client: SupabaseClient<Database>,
): Promise<CategoryListingSection[]> {
  const { data: sections } = await client
    .from("homepage_sections")
    .select("*")
    .like("slug", "web_cat_%")
    .order("sort_order", { ascending: true });

  if (!sections || sections.length === 0) return [];

  const categorySlugs = sections.map((s) => s.slug.replace(/^web_cat_/, ""));

  const { data: listings } = await client
    .from("listings")
    .select("id, title, price, price_unit, images, location, view_count, category")
    .in("category", categorySlugs)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(categorySlugs.length * 8);

  const listingsByCategory = new Map<string, CategoryListingSection["listings"]>();
  for (const l of listings ?? []) {
    const arr = listingsByCategory.get(l.category) ?? [];
    if (arr.length < 8) arr.push(l);
    listingsByCategory.set(l.category, arr);
  }

  return sections.map((s) => {
    const catSlug = s.slug.replace(/^web_cat_/, "");
    return { ...s, categorySlug: catSlug, listings: listingsByCategory.get(catSlug) ?? [] };
  });
}

function emptyData(): WebHomeData {
  return {
    web_hero_slider: null,
    web_categories_strip: null,
    web_flash_deals: null,
    web_trending: null,
    web_promo_banners: null,
    web_featured_suppliers: null,
  };
}
