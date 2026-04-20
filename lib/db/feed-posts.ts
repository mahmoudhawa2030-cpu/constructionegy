/**
 * All feed_posts database queries in one place.
 * When migrating away from Supabase, only this file needs to change.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type FeedPostRow = Database["public"]["Tables"]["feed_posts"]["Row"];

export async function fetchPublishedFeedPosts(
  client: SupabaseClient<Database>,
  opts: { limit?: number; veteransCorner?: boolean } = {},
): Promise<FeedPostRow[]> {
  const { limit = 60, veteransCorner = false } = opts;
  const { data, error } = await client
    .from("feed_posts")
    .select("*")
    .eq("status", "published")
    .eq("is_veterans_corner", veteransCorner)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function fetchFeedPostById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<FeedPostRow | null> {
  const { data, error } = await client
    .from("feed_posts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchUserFeedPosts(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 48,
): Promise<FeedPostRow[]> {
  const { data, error } = await client
    .from("feed_posts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
