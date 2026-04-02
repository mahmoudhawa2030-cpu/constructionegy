import type { SupabaseClient } from "@supabase/supabase-js";

import { hrefForSubscriptionFeature } from "@/lib/homepage/desktop-card-href";
import type { Database } from "@/lib/supabase/database.types";
import { desktopCategoryIconPublicUrl } from "@/lib/supabase/desktop-category-icon-url";

export type DesktopHomeCardItem = {
  id: string;
  label_ar: string;
  label_en: string | null;
  /** Category slug or feature_key — used for English title fallback when label_en is empty. */
  titleFallbackKey: string;
  href: string;
  image_public_url: string;
};

/** @deprecated Use DesktopHomeCardItem */
export type DesktopHomeCategoryRow = DesktopHomeCardItem;

/** Desktop home cards: enabled rows; category → gallery filter, service → app route from feature key. */
export async function fetchDesktopHomeCards(client: SupabaseClient<Database>): Promise<DesktopHomeCardItem[]> {
  const { data: cards, error: cErr } = await client
    .from("homepage_desktop_category_cards")
    .select("id, category_slug, subscription_feature_key, image_storage_path, sort_order")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (cErr || !cards?.length) {
    return [];
  }

  const slugs = [...new Set(cards.map((c) => c.category_slug).filter((s): s is string => Boolean(s)))];
  const featureKeys = [
    ...new Set(cards.map((c) => c.subscription_feature_key).filter((k): k is string => Boolean(k))),
  ];

  const [catsRes, svcRes] = await Promise.all([
    slugs.length
      ? client.from("categories").select("slug, label_ar, label_en").in("slug", slugs).eq("is_active", true)
      : Promise.resolve({ data: [] as { slug: string; label_ar: string; label_en: string | null }[], error: null }),
    featureKeys.length
      ? client.from("subscription_services").select("feature_key, label_ar, label_en").in("feature_key", featureKeys)
      : Promise.resolve({ data: [] as { feature_key: string; label_ar: string; label_en: string }[], error: null }),
  ]);

  const catMap = new Map((catsRes.data ?? []).map((c) => [c.slug, c]));
  const svcMap = new Map((svcRes.data ?? []).map((s) => [s.feature_key, s]));
  const out: DesktopHomeCardItem[] = [];

  for (const card of cards) {
    if (card.category_slug) {
      const cat = catMap.get(card.category_slug);
      if (!cat) continue;
      out.push({
        id: card.id,
        label_ar: cat.label_ar,
        label_en: cat.label_en,
        titleFallbackKey: card.category_slug,
        href: `/gallery?category=${encodeURIComponent(card.category_slug)}`,
        image_public_url: desktopCategoryIconPublicUrl(card.image_storage_path),
      });
      continue;
    }
    if (card.subscription_feature_key) {
      const svc = svcMap.get(card.subscription_feature_key);
      if (!svc) continue;
      out.push({
        id: card.id,
        label_ar: svc.label_ar,
        label_en: svc.label_en,
        titleFallbackKey: card.subscription_feature_key,
        href: hrefForSubscriptionFeature(card.subscription_feature_key),
        image_public_url: desktopCategoryIconPublicUrl(card.image_storage_path),
      });
    }
  }

  return out;
}

/** @deprecated Use fetchDesktopHomeCards */
export async function fetchDesktopHomeCategories(
  client: SupabaseClient<Database>,
): Promise<DesktopHomeCardItem[]> {
  return fetchDesktopHomeCards(client);
}

export function desktopCardTitleForLocale(
  row: Pick<DesktopHomeCardItem, "label_ar" | "label_en" | "titleFallbackKey">,
  locale: "ar" | "en",
): string {
  if (locale === "ar") {
    return row.label_ar.trim();
  }
  const en = row.label_en?.trim();
  if (en) return en;
  return row.titleFallbackKey
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** @deprecated Use desktopCardTitleForLocale */
export function categoryTitleForLocale(
  row: Pick<DesktopHomeCardItem, "label_ar" | "label_en" | "titleFallbackKey">,
  locale: "ar" | "en",
): string {
  return desktopCardTitleForLocale(row, locale);
}
