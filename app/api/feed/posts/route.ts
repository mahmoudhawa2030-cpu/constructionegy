import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
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
    console.log("[feed/posts] received imageUrls:", imageUrls);
    for (const url of imageUrls) {
      const isValid = typeof url === "string" && isValidUploadedFeedPostImageUrl(url, user.id);
      if (!isValid) {
        console.error("[feed/posts] invalid image URL:", {
          url,
          userId: user.id,
          looksLikeSupabaseUrl: url?.includes("supabase.co") || url?.includes("storage/v1"),
        });
        return NextResponse.json({
          error: "invalid_images",
          receivedUrls: imageUrls,
          message: "One or more image URLs failed validation. Check console for details."
        }, { status: 400 });
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

  console.log("[feed/posts] successfully created post:", data.id, "with", imageUrls.length, "images");
  return NextResponse.json({ id: data.id });
}
