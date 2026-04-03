import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type FeedListingItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  condition: string;
  price: number;
  price_unit: string;
  location: string | null;
  images: string[];
  created_at: string;
  user_id: string;
  seller_name: string;
  seller_role: string;
  is_pro: boolean;
};

export async function fetchFeedItems(
  client: SupabaseClient<Database>,
  limit = 20,
): Promise<FeedListingItem[]> {
  const { data: listings, error } = await client
    .from("listings")
    .select("id,title,description,category,type,condition,price,price_unit,location,images,created_at,user_id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !listings?.length) return [];

  const userIds = [...new Set(listings.map((l) => l.user_id))];
  const { data: profiles } = await client
    .from("profiles")
    .select("id,full_name,user_type,business_verification_status")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return listings.map((l) => {
    const p = profileMap.get(l.user_id);
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      category: l.category,
      type: l.type,
      condition: l.condition,
      price: l.price,
      price_unit: l.price_unit,
      location: l.location,
      images: l.images ?? [],
      created_at: l.created_at,
      user_id: l.user_id,
      seller_name: p?.full_name ?? "—",
      seller_role: p?.user_type ?? "contractor",
      is_pro: p?.business_verification_status === "verified",
    };
  });
}
