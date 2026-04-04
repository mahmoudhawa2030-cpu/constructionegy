"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
import { createFeedPostSchema, feedPostImageUrlsSchema } from "@/lib/feed/post-schema";
import { isValidUploadedFeedPostImageUrl } from "@/lib/feed/validate-feed-post-image-url";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export type CreateFeedPostState =
  | { ok: true; id: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: { body?: string; location?: string };
    };

export type CreateFeedPostPayload = {
  body: string;
  location: string;
  imageUrls: string[];
};

async function runCreateFeedPost(
  supabase: SupabaseClient<Database>,
  userId: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
  rawBody: string,
  rawLocation: string,
  imageUrlsInput: string[],
): Promise<CreateFeedPostState> {
  let imageUrls: string[];
  try {
    imageUrls = [...new Set(feedPostImageUrlsSchema.parse(imageUrlsInput))];
  } catch {
    return { ok: false, formError: t("errors.invalidImages") };
  }

  let supabasePublicUrl: string;
  try {
    supabasePublicUrl = getSupabasePublicEnv().url.replace(/\/$/, "");
  } catch {
    return { ok: false, formError: t("errors.saveFailed") };
  }

  for (const u of imageUrls) {
    if (!isValidUploadedFeedPostImageUrl(u, userId, supabasePublicUrl)) {
      return { ok: false, formError: t("errors.invalidImages") };
    }
  }

  const parsed = createFeedPostSchema.safeParse({
    body: rawBody,
    location: rawLocation,
  });
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
      user_id: userId,
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

/**
 * Preferred: JSON-serializable payload so `imageUrls` always reach the server (FormData + programmatic
 * server-action calls can drop or empty custom fields in some setups).
 */
export async function createFeedPostWithImages(payload: CreateFeedPostPayload): Promise<CreateFeedPostState> {
  const t = await getTranslations("feedPost");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, formError: t("errors.unauthorized") };
  }

  return runCreateFeedPost(
    supabase,
    user.id,
    t,
    payload.body,
    payload.location,
    Array.isArray(payload.imageUrls) ? payload.imageUrls : [],
  );
}

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

  const rawBody = String(formData.get("body") ?? "");
  const rawLocation = String(formData.get("location") ?? "");

  let imageUrls: string[] = [];
  const rawImagesJson = String(formData.get("imageUrls") ?? "");
  if (rawImagesJson.trim().length > 0) {
    try {
      const decoded = JSON.parse(rawImagesJson) as unknown;
      if (!Array.isArray(decoded)) {
        return { ok: false, formError: t("errors.invalidImages") };
      }
      imageUrls = decoded.map((x) => String(x ?? ""));
    } catch {
      return { ok: false, formError: t("errors.invalidImages") };
    }
  }

  return runCreateFeedPost(supabase, user.id, t, rawBody, rawLocation, imageUrls);
}
