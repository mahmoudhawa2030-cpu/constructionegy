import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type {
  NewsTickerConfig,
  NewsTickerItem,
  ResolvedNewsTicker,
  TickerDataSource,
  TickerPageScope,
  TickerPlatform,
} from "./types";

type Sb = SupabaseClient<Database>;

type TickerRow = {
  id: string;
  name: string;
  enabled: boolean;
  platform: string;
  page_scope: string;
  page_path: string;
  data_source: string;
  max_items: number;
  speed_seconds: number;
  label_ar: string;
  label_en: string;
  bg_color: string;
  text_color: string;
  accent_color: string;
  sort_order: number;
};

type ItemRow = {
  id: string;
  ticker_id: string;
  text_ar: string;
  text_en: string;
  href: string;
  enabled: boolean;
  sort_order: number;
};

function mapItem(r: ItemRow): NewsTickerItem {
  return {
    id: r.id,
    textAr: r.text_ar ?? "",
    textEn: r.text_en ?? "",
    href: r.href ?? "",
    enabled: Boolean(r.enabled),
    sortOrder: r.sort_order ?? 0,
  };
}

function mapTicker(r: TickerRow, items: NewsTickerItem[]): NewsTickerConfig {
  return {
    id: r.id,
    name: r.name,
    enabled: Boolean(r.enabled),
    platform: (r.platform as TickerPlatform) || "both",
    pageScope: (r.page_scope as TickerPageScope) || "all",
    pagePath: r.page_path ?? "",
    dataSource: (r.data_source as TickerDataSource) || "custom",
    maxItems: r.max_items ?? 10,
    speedSeconds: r.speed_seconds ?? 28,
    labelAr: r.label_ar ?? "عاجل",
    labelEn: r.label_en ?? "News",
    bgColor: r.bg_color ?? "#0f172a",
    textColor: r.text_color ?? "#f8fafc",
    accentColor: r.accent_color ?? "#ef4444",
    sortOrder: r.sort_order ?? 0,
    items,
  };
}

export function matchesPlatform(platform: TickerPlatform, surface: "web" | "mobile"): boolean {
  return platform === "both" || platform === surface;
}

export function matchesPageScope(
  scope: TickerPageScope,
  pagePath: string,
  pathname: string,
): boolean {
  const path = (pathname || "/").split("?")[0] || "/";
  switch (scope) {
    case "all":
      return true;
    case "home":
      return path === "/" || path === "/web" || path === "/web/";
    case "listings":
      return (
        path.startsWith("/listings") ||
        path.startsWith("/web/listings") ||
        path.startsWith("/gallery") ||
        path.startsWith("/web/gallery")
      );
    case "blog":
      return path.startsWith("/blog") || path.includes("/blog/");
    case "rfq":
      return path.startsWith("/rfq") || path.startsWith("/web/rfq");
    case "custom": {
      const prefix = (pagePath || "").trim() || "/";
      if (prefix === "/") return path === "/" || path === "/web" || path === "/web/";
      return path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`);
    }
    default:
      return false;
  }
}

/** Admin: list all tickers with items (including disabled). */
export async function listNewsTickersAdmin(supabase: Sb): Promise<NewsTickerConfig[]> {
  const { data: tickers, error } = await (supabase as any)
    .from("news_tickers")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (tickers ?? []) as TickerRow[];
  if (!rows.length) return [];

  const ids = rows.map((r) => r.id);
  const { data: items, error: itemsErr } = await (supabase as any)
    .from("news_ticker_items")
    .select("*")
    .in("ticker_id", ids)
    .order("sort_order", { ascending: true });

  if (itemsErr) throw new Error(itemsErr.message);
  const itemRows = (items ?? []) as ItemRow[];
  const byTicker = new Map<string, NewsTickerItem[]>();
  for (const it of itemRows) {
    const list = byTicker.get(it.ticker_id) ?? [];
    list.push(mapItem(it));
    byTicker.set(it.ticker_id, list);
  }

  return rows.map((r) => mapTicker(r, byTicker.get(r.id) ?? []));
}

export async function getNewsTickerAdmin(
  supabase: Sb,
  id: string,
): Promise<NewsTickerConfig | null> {
  const { data, error } = await (supabase as any)
    .from("news_tickers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: items, error: itemsErr } = await (supabase as any)
    .from("news_ticker_items")
    .select("*")
    .eq("ticker_id", id)
    .order("sort_order", { ascending: true });
  if (itemsErr) throw new Error(itemsErr.message);

  return mapTicker(data as TickerRow, ((items ?? []) as ItemRow[]).map(mapItem));
}

async function resolveSourceLines(
  supabase: Sb,
  source: TickerDataSource,
  maxItems: number,
  locale: "ar" | "en",
  customItems: NewsTickerItem[],
): Promise<{ id: string; text: string; href: string | null }[]> {
  const limit = Math.min(Math.max(maxItems, 1), 50);

  if (source === "custom") {
    return customItems
      .filter((i) => i.enabled)
      .slice(0, limit)
      .map((i) => {
        const text = locale === "ar" ? i.textAr || i.textEn : i.textEn || i.textAr;
        return { id: i.id, text: text.trim(), href: i.href.trim() || null };
      })
      .filter((l) => l.text.length > 0);
  }

  if (source === "seo_posts") {
    const { data } = await (supabase as any)
      .from("seo_posts")
      .select("id, title, slug, category_slug, meta_title")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Array<{ id: string; title: string; slug: string; category_slug: string; meta_title: string | null }>).map(
      (p) => ({
        id: p.id,
        text: (p.meta_title || p.title || "").trim(),
        href: p.category_slug && p.slug ? `/${p.category_slug}/${p.slug}` : p.slug ? `/blog/${p.slug}` : null,
      }),
    ).filter((l) => l.text);
  }

  if (source === "listings") {
    const { data } = await (supabase as any)
      .from("listings")
      .select("id, title")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Array<{ id: string; title?: string | null }>).map((l) => ({
      id: l.id,
      text: (l.title || "").trim(),
      href: `/listings/${l.id}`,
    })).filter((x) => x.text);
  }

  if (source === "rfq") {
    const { data } = await (supabase as any)
      .from("rfq_drafts")
      .select("id, title, description")
      .in("status", ["open_for_bids", "submitted"])
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as Array<{ id: string; title?: string | null; description?: string | null }>).map(
      (r) => ({
        id: r.id,
        text: (r.title || r.description || `RFQ ${r.id.slice(0, 8)}`).trim().slice(0, 120),
        href: `/rfq/${r.id}`,
      }),
    ).filter((x) => x.text);
  }

  return [];
}

/**
 * Public: first matching enabled ticker for surface + pathname, with resolved lines.
 */
export async function getActiveNewsTicker(
  supabase: Sb,
  opts: { surface: "web" | "mobile"; pathname: string; locale: "ar" | "en" },
): Promise<ResolvedNewsTicker | null> {
  const { data, error } = await (supabase as any)
    .from("news_tickers")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return null;
  const rows = data as TickerRow[];

  const match = rows.find(
    (r) =>
      matchesPlatform((r.platform as TickerPlatform) || "both", opts.surface) &&
      matchesPageScope((r.page_scope as TickerPageScope) || "all", r.page_path ?? "", opts.pathname),
  );
  if (!match) return null;

  let customItems: NewsTickerItem[] = [];
  if (match.data_source === "custom") {
    const { data: items } = await (supabase as any)
      .from("news_ticker_items")
      .select("*")
      .eq("ticker_id", match.id)
      .eq("enabled", true)
      .order("sort_order", { ascending: true });
    customItems = ((items ?? []) as ItemRow[]).map(mapItem);
  }

  const lines = await resolveSourceLines(
    supabase,
    (match.data_source as TickerDataSource) || "custom",
    match.max_items ?? 10,
    opts.locale,
    customItems,
  );
  if (!lines.length) return null;

  const label =
    opts.locale === "ar"
      ? match.label_ar || match.label_en || "عاجل"
      : match.label_en || match.label_ar || "News";

  return {
    id: match.id,
    label,
    speedSeconds: match.speed_seconds ?? 28,
    bgColor: match.bg_color ?? "#0f172a",
    textColor: match.text_color ?? "#f8fafc",
    accentColor: match.accent_color ?? "#ef4444",
    lines,
  };
}
