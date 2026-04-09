import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
import { isValidUploadedFeedPostImageUrl } from "@/lib/feed/validate-feed-post-image-url";

const BODY_MAX = 8000;
const LOC_MAX = 120;
const MAX_IMAGES_CAP = 9;

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteCtx) {
  const { id: postId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("feed_posts")
    .select("id,user_id,status")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !row || row.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as { body?: unknown; location?: unknown; imageUrls?: unknown };
  const postBody = typeof b.body === "string" ? b.body : "";
  const rawLoc = typeof b.location === "string" ? b.location : "";
  const imageUrls = Array.isArray(b.imageUrls) ? b.imageUrls : [];

  if (!postBody.trim()) {
    return NextResponse.json({ error: "body_required" }, { status: 400 });
  }
  if (postBody.length > BODY_MAX) {
    return NextResponse.json({ error: "body_too_long" }, { status: 400 });
  }
  if (rawLoc.length > LOC_MAX) {
    return NextResponse.json({ error: "location_too_long" }, { status: 400 });
  }
  if (imageUrls.length > MAX_IMAGES_CAP) {
    return NextResponse.json({ error: "too_many_images" }, { status: 400 });
  }

  for (const url of imageUrls) {
    if (typeof url !== "string" || !isValidUploadedFeedPostImageUrl(url, user.id)) {
      return NextResponse.json({ error: "invalid_images" }, { status: 400 });
    }
  }

  const title = deriveFeedPostTitle(postBody);
  const location = rawLoc.trim() ? rawLoc.trim() : null;

  const { error: updErr } = await supabase
    .from("feed_posts")
    .update({
      title,
      body: postBody.trim(),
      location,
      images: imageUrls as string[],
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("user_id", user.id);

  if (updErr) {
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const { id: postId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("feed_posts")
    .select("id,user_id,status")
    .eq("id", postId)
    .maybeSingle();

  if (fetchErr || !row || row.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase.from("feed_posts").delete().eq("id", postId).eq("user_id", user.id);

  if (delErr) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);

  return NextResponse.json({ ok: true });
}
