import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type PersonalizationContext = {
  viewerId: string;
  viewerLocationNorm: string | null;
  viewerUserType: "contractor" | "supplier" | null;
  favoriteCategories: Set<string>;
  implicitCategories: Set<string>;
  connectedSellerIds: Set<string>;
  likedAuthorIds: Set<string>;
  savedAuthorIds: Set<string>;
  likedPostIds: Set<string>;
  savedPostIds: Set<string>;
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
  const [profileRes, chatsRes, likesRes, savesRes] = await Promise.all([
    client.from("profiles").select("location,user_type").eq("id", userId).maybeSingle(),
    client
      .from("chats")
      .select("participant1_id,participant2_id")
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .limit(60),
    client
      .from("feed_post_likes")
      .select("post_id, feed_posts(user_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("feed_post_saves")
      .select("post_id, feed_posts(user_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const viewerLocationNorm = normalizeLocationString(profileRes.data?.location ?? null);
  const viewerUserType = (profileRes.data?.user_type ?? null) as "contractor" | "supplier" | null;

  const connectedSellerIds = new Set<string>();
  for (const c of chatsRes.data ?? []) {
    if (c.participant1_id !== userId) connectedSellerIds.add(c.participant1_id);
    if (c.participant2_id !== userId) connectedSellerIds.add(c.participant2_id);
  }

  const likedAuthorIds = new Set<string>();
  const likedPostIds = new Set<string>();
  for (const row of likesRes.data ?? []) {
    likedPostIds.add(row.post_id);
    const authorId = (row.feed_posts as { user_id: string } | null)?.user_id;
    if (authorId) likedAuthorIds.add(authorId);
  }

  const savedAuthorIds = new Set<string>();
  const savedPostIds = new Set<string>();
  for (const row of savesRes.data ?? []) {
    savedPostIds.add(row.post_id);
    const authorId = (row.feed_posts as { user_id: string } | null)?.user_id;
    if (authorId) savedAuthorIds.add(authorId);
  }

  return {
    viewerId: userId,
    viewerLocationNorm,
    viewerUserType,
    favoriteCategories: new Set<string>(),
    implicitCategories: new Set<string>(),
    connectedSellerIds,
    likedAuthorIds,
    savedAuthorIds,
    likedPostIds,
    savedPostIds,
  };
}
