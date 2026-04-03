import type { SupabaseClient } from "@supabase/supabase-js";

import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import type { Database } from "@/lib/supabase/database.types";

export async function enrichFeedPostsSocial(
  client: SupabaseClient<Database>,
  items: FeedPostItem[],
  viewerId: string | null,
): Promise<void> {
  if (items.length === 0) return;

  const ids = items.map((i) => i.id);

  const [likesRes, commentsRes, myLikesRes, mySavesRes] = await Promise.all([
    client.from("feed_post_likes").select("post_id").in("post_id", ids),
    client.from("feed_post_comments").select("post_id").in("post_id", ids),
    viewerId
      ? client.from("feed_post_likes").select("post_id").eq("user_id", viewerId).in("post_id", ids)
      : Promise.resolve({ data: null as { post_id: string }[] | null }),
    viewerId
      ? client.from("feed_post_saves").select("post_id").eq("user_id", viewerId).in("post_id", ids)
      : Promise.resolve({ data: null as { post_id: string }[] | null }),
  ]);

  const likeCount = new Map<string, number>();
  for (const r of likesRes.data ?? []) {
    likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1);
  }

  const commentCount = new Map<string, number>();
  for (const r of commentsRes.data ?? []) {
    commentCount.set(r.post_id, (commentCount.get(r.post_id) ?? 0) + 1);
  }

  const myLikeSet = new Set((myLikesRes.data ?? []).map((r) => r.post_id));
  const mySaveSet = new Set((mySavesRes.data ?? []).map((r) => r.post_id));

  for (const item of items) {
    item.likeCount = likeCount.get(item.id) ?? 0;
    item.commentCount = commentCount.get(item.id) ?? 0;
    item.likedByViewer = Boolean(viewerId && myLikeSet.has(item.id));
    item.savedByViewer = Boolean(viewerId && mySaveSet.has(item.id));
  }
}
