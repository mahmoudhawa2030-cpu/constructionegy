import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type FeedPostItem = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  images: string[];
  location: string | null;
  view_count: number;
  created_at: string;
  author_name: string;
  author_role: string;
  is_pro: boolean;
};

type FeedPostRow = Database["public"]["Tables"]["feed_posts"]["Row"];

type ProfileMini = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "user_type" | "business_verification_status"
>;

function mapRows(rows: FeedPostRow[], profileMap: Map<string, ProfileMini>): FeedPostItem[] {
  return rows.map((row) => {
    const p = profileMap.get(row.user_id);
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      body: row.body,
      images: row.images ?? [],
      location: row.location,
      view_count: row.view_count,
      created_at: row.created_at,
      author_name: p?.full_name ?? "—",
      author_role: p?.user_type ?? "contractor",
      is_pro: p?.business_verification_status === "verified",
    };
  });
}

async function attachProfiles(client: SupabaseClient<Database>, rows: FeedPostRow[]): Promise<FeedPostItem[]> {
  if (!rows.length) return [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await client
    .from("profiles")
    .select("id,full_name,user_type,business_verification_status")
    .in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as ProfileMini]));
  return mapRows(rows, profileMap);
}

/** Published user posts excluding Veterans Corner rows (those are shown in the dedicated slot). */
export async function fetchFeedPostPool(
  client: SupabaseClient<Database>,
  limit = 60,
): Promise<FeedPostItem[]> {
  const { data: posts, error } = await client
    .from("feed_posts")
    .select("*")
    .eq("status", "published")
    .eq("is_veterans_corner", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !posts?.length) return [];
  return attachProfiles(client, posts);
}

/** Latest published Veterans Corner post (admin-flagged), if any. */
export async function fetchLatestVeteransPost(client: SupabaseClient<Database>): Promise<FeedPostItem | null> {
  const { data: row, error } = await client
    .from("feed_posts")
    .select("*")
    .eq("status", "published")
    .eq("is_veterans_corner", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) return null;
  const [item] = await attachProfiles(client, [row]);
  return item ?? null;
}
