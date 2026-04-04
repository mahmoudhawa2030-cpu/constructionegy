"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
import { createFeedPostSchema, feedPostImageUrlsSchema } from "@/lib/feed/post-schema";
import { isValidUploadedFeedPostImageUrl } from "@/lib/feed/validate-feed-post-image-url";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export type CreateFeedPostState =
  | { ok: true; id: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: { body?: string; location?: string };
    };

export async function createFeedPostFromForm(
  _prev: CreateFeedPostState | null,
  formData: FormData,
): Promise<CreateFeedPostState> {
  const t = await getTranslations("feedPost");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, formError: t("errors.unauthorized") };
  }

  const raw = {
    body: String(formData.get("body") ?? ""),
    location: String(formData.get("location") ?? ""),
  };

  let imageUrls: string[] = [];
  const rawImagesJson = String(formData.get("imageUrls") ?? "");
  if (rawImagesJson.trim().length > 0) {
    try {
      const decoded = JSON.parse(rawImagesJson) as unknown;
      imageUrls = [...new Set(feedPostImageUrlsSchema.parse(decoded))];
    } catch {
      return { ok: false, formError: t("errors.invalidImages") };
    }
  }

  let supabasePublicUrl: string;
  try {
    supabasePublicUrl = getSupabasePublicEnv().url.replace(/\/$/, "");
  } catch {
    return { ok: false, formError: t("errors.saveFailed") };
  }

  for (const u of imageUrls) {
    if (!isValidUploadedFeedPostImageUrl(u, user.id, supabasePublicUrl)) {
      return { ok: false, formError: t("errors.invalidImages") };
    }
  }

  const parsed = createFeedPostSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: { body?: string; location?: string } = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      const msg = issue.message as "bodyRequired" | "bodyTooLong" | "locationTooLong";
      if (path === "body") fieldErrors.body = t(`errors.${msg}`);
      else if (path === "location") fieldErrors.location = t(`errors.${msg}`);
    }
    return { ok: false, fieldErrors };
  }

  const { body, location } = parsed.data;
  const title = deriveFeedPostTitle(body);

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      title,
      body,
      location,
      images: imageUrls,
      status: "published",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, formError: t("errors.saveFailed") };
  }

  revalidatePath("/");
  revalidatePath(`/posts/${data.id}`);

  return { ok: true, id: data.id };
}
