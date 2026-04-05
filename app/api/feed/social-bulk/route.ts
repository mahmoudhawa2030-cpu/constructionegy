import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_IDS = 60;

type BulkItem = {
  id: string;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  savedByViewer: boolean;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw = (body as { postIds?: unknown }).postIds;
  const postIds = Array.isArray(raw)
    ? raw.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];

  if (postIds.length === 0 || postIds.length > MAX_IDS) {
    return NextResponse.json({ error: "bad_post_ids" }, { status: 400 });
  }

  const uniqueIds = [...new Set(postIds)];

  const { data: rows, error } = await supabase
    .from("feed_posts")
    .select("id, like_count, comment_count")
    .in("id", uniqueIds)
    .eq("status", "published");

  if (error) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  const items: BulkItem[] = (rows ?? []).map((r) => ({
    id: r.id,
    likeCount: r.like_count ?? 0,
    commentCount: r.comment_count ?? 0,
    likedByViewer: false,
    savedByViewer: false,
  }));

  if (user && items.length > 0) {
    const ids = items.map((i) => i.id);
    const [likesRes, savesRes] = await Promise.all([
      supabase.from("feed_post_likes").select("post_id").eq("user_id", user.id).in("post_id", ids),
      supabase.from("feed_post_saves").select("post_id").eq("user_id", user.id).in("post_id", ids),
    ]);
    const likeSet = new Set((likesRes.data ?? []).map((r) => r.post_id));
    const saveSet = new Set((savesRes.data ?? []).map((r) => r.post_id));
    for (const it of items) {
      it.likedByViewer = likeSet.has(it.id);
      it.savedByViewer = saveSet.has(it.id);
    }
  }

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
