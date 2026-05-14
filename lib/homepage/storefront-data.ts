import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

import type {
  StorefrontCategory,
  StorefrontListing,
  StorefrontOrder,
  StorefrontSupplier,
} from "@/components/home-storefront";

const CATEGORY_EMOJI: Record<string, string> = {
  machinery: "🏗",
  electronics: "⚡",
  safety: "🦺",
  materials: "🧱",
  raw_materials: "🧱",
  logistics: "🚚",
  chemicals: "🧪",
  healthcare: "❤️",
  packaging: "📦",
  tools: "🔧",
  equipment: "⚙️",
  cement: "🪨",
  steel: "🔩",
  wood: "🪵",
  paint: "🎨",
  plumbing: "🚰",
  electrical: "💡",
};

function emojiFor(slug: string): string {
  const k = slug.toLowerCase();
  return CATEGORY_EMOJI[k] ?? "📦";
}

export async function fetchStorefrontData(
  client: SupabaseClient<Database>,
  userId: string | null,
): Promise<{
  categories: StorefrontCategory[];
  flashDeals: StorefrontListing[];
  trending: StorefrontListing[];
  suppliers: StorefrontSupplier[];
  recentOrders: StorefrontOrder[];
}> {
  const [catsRes, listingsRes, suppliersRes, ordersRes] = await Promise.all([
    client
      .from("categories")
      .select("slug, label_ar, label_en")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(10),
    client
      .from("listings")
      .select("id, title, price, price_unit, category, location, images, view_count, created_at, user_id")
      .eq("status", "active")
      .order("view_count", { ascending: false })
      .limit(12),
    client
      .from("profiles")
      .select("id, full_name, avatar_url, business_verification_status, legal_company_name")
      .eq("business_verification_status", "approved")
      .limit(6),
    userId
      ? client
          .from("rfq_drafts" as never)
          .select("id, title, status, created_at, metadata" as never)
          .eq("user_id" as never, userId as never)
          .order("created_at" as never, { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const categories: StorefrontCategory[] = (catsRes.data ?? []).map((c) => ({
    slug: c.slug,
    label_ar: c.label_ar,
    label_en: c.label_en,
    icon_emoji: emojiFor(c.slug),
  }));

  const allListings: StorefrontListing[] = (listingsRes.data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
    price_unit: l.price_unit ?? "EGP",
    category: l.category,
    location: l.location,
    images: l.images ?? [],
    view_count: l.view_count ?? 0,
    created_at: l.created_at,
  }));

  // Flash deals: top 6 most-viewed
  const flashDeals = allListings.slice(0, 6);
  // Trending: next 4 (gallery-style 2x2 grid)
  const trending = allListings.slice(6, 10).length > 0 ? allListings.slice(6, 10) : allListings.slice(0, 4);

  // Count listings per supplier (best-effort, 1 query)
  const supplierIds = (suppliersRes.data ?? []).map((p) => p.id);
  const countMap = new Map<string, number>();
  if (supplierIds.length > 0) {
    const { data: counts } = await client
      .from("listings")
      .select("user_id")
      .in("user_id", supplierIds)
      .eq("status", "active");
    for (const row of counts ?? []) {
      countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1);
    }
  }

  const suppliers: StorefrontSupplier[] = (suppliersRes.data ?? []).map((p) => ({
    id: p.id,
    display_name: p.legal_company_name?.trim() || p.full_name || "Supplier",
    avatar_url: p.avatar_url,
    verified: p.business_verification_status === "approved",
    listing_count: countMap.get(p.id) ?? 0,
  }));

  const orderRows = (ordersRes as { data: unknown[] | null }).data ?? [];
  const recentOrders: StorefrontOrder[] = orderRows
    .filter((r): r is { id: string; title: string | null; status: string | null; created_at: string } => {
      return Boolean(r && typeof r === "object" && "id" in r);
    })
    .map((r) => ({
      id: r.id,
      title: r.title ?? "RFQ",
      status: r.status ?? "processing",
      created_at: r.created_at,
    }));

  return { categories, flashDeals, trending, suppliers, recentOrders };
}
