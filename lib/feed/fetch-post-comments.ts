import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type FeedPostCommentItem = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_user_id: string;
  parent_id: string | null;
};

export async function fetchFeedPostComments(
  client: SupabaseClient<Database>,
  postId: string,
): Promise<FeedPostCommentItem[]> {
  type RawRow = {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
  };

  const { data: rawRows, error } = await (client
    .from("feed_post_comments")
    .select("id,body,created_at,user_id,parent_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true }) as unknown as Promise<{ data: RawRow[] | null; error: unknown }>);

  const rows = rawRows;
  if (error || !rows?.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await client.from("profiles").select("id,full_name").in("id", userIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    created_at: r.created_at,
    author_name: nameById.get(r.user_id) ?? "—",
    author_user_id: r.user_id,
    parent_id: r.parent_id ?? null,
  }));
}
