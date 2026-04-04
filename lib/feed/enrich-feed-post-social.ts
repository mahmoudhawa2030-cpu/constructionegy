import type { SupabaseClient } from "@supabase/supabase-js";

import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import type { Database } from "@/lib/supabase/database.types";

export async function enrichFeedPostsSocial(
  client: SupabaseClient<Database>,
  items: FeedPostItem[],
  viewerId: string | null,
): Promise<void> {
  if (items.length === 0 || !viewerId) return;

  const ids = items.map((i) => i.id);

  const [myLikesRes, mySavesRes] = await Promise.all([
    client.from("feed_post_likes").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    client.from("feed_post_saves").select("post_id").eq("user_id", viewerId).in("post_id", ids),
  ]);

  const myLikeSet = new Set((myLikesRes.data ?? []).map((r) => r.post_id));
  const mySaveSet = new Set((mySavesRes.data ?? []).map((r) => r.post_id));

  for (const item of items) {
    item.likedByViewer = myLikeSet.has(item.id);
    item.savedByViewer = mySaveSet.has(item.id);
  }
}
