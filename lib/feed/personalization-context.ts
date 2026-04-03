import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type PersonalizationContext = {
  viewerId: string;
  viewerLocationNorm: string | null;
  favoriteCategories: Set<string>;
  implicitCategories: Set<string>;
  connectedSellerIds: Set<string>;
};

function normalizeLocationString(loc: string | null): string | null {
  if (!loc) return null;
  const s = loc.trim().toLowerCase();
  return s.length ? s : null;
}

export async function fetchPersonalizationContext(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<PersonalizationContext> {
  const [profileRes, favRes, myListingsRes, chatsRes] = await Promise.all([
    client.from("profiles").select("location").eq("id", userId).maybeSingle(),
    client.from("listing_favorites").select("listing_id").eq("user_id", userId).limit(80),
    client.from("listings").select("category").eq("user_id", userId).eq("status", "active").limit(50),
    client
      .from("chats")
      .select("participant1_id,participant2_id")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .limit(100),
  ]);

  const viewerLocationNorm = normalizeLocationString(profileRes.data?.location ?? null);

  const favIds = (favRes.data ?? []).map((r) => r.listing_id);
  let favoriteCategories = new Set<string>();
  if (favIds.length > 0) {
    const { data: favListings } = await client.from("listings").select("category").in("id", favIds);
    favoriteCategories = new Set((favListings ?? []).map((l) => l.category));
  }

  const implicitCategories = new Set((myListingsRes.data ?? []).map((l) => l.category));

  const connectedSellerIds = new Set<string>();
  for (const c of chatsRes.data ?? []) {
    if (c.participant1_id !== userId) connectedSellerIds.add(c.participant1_id);
    if (c.participant2_id !== userId) connectedSellerIds.add(c.participant2_id);
  }

  return {
    viewerId: userId,
    viewerLocationNorm,
    favoriteCategories,
    implicitCategories,
    connectedSellerIds,
  };
}
