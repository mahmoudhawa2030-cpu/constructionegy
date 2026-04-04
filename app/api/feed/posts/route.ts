import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isValidUploadedFeedPostImageUrl } from "@/lib/feed/validate-feed-post-image-url";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { body: postBody, location, imageUrls = [] } = body;

  if (!postBody || typeof postBody !== "string" || postBody.trim().length === 0) {
    return NextResponse.json({ error: "body_required" }, { status: 400 });
  }

  // Basic validation for image URLs
  if (imageUrls.length > 0) {
    const publicUrl = getSupabasePublicEnv().url.replace(/\/$/, "");
    for (const url of imageUrls) {
      if (typeof url !== "string" || !isValidUploadedFeedPostImageUrl(url, user.id)) {
        return NextResponse.json({ error: "invalid_images" }, { status: 400 });
      }
    }
  }

  const title = deriveFeedPostTitle(postBody);

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      title,
      body: postBody.trim(),
      location: location && typeof location === "string" ? location.trim() : null,
      images: imageUrls,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Feed post creation error:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
