"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { deriveFeedPostTitle } from "@/lib/feed/derive-post-title";
import { normalizeImageUrlsArgument } from "@/lib/feed/normalize-feed-post-images";
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

async function runCreateFeedPost(
  supabase: SupabaseClient<Database>,
  userId: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
  rawBody: string,
  rawLocation: string,
  imageUrlsInput: unknown,
): Promise<CreateFeedPostState> {
  const normalizedIncoming = normalizeImageUrlsArgument(imageUrlsInput);
  let imageUrls: string[];
  try {
    imageUrls = [...new Set(feedPostImageUrlsSchema.parse(normalizedIncoming))];
  } catch {
    return { ok: false, formError: t("errors.invalidImages") };
  }

  // Trust URLs from the server upload action — no more strict validation that was breaking valid Supabase URLs
  if (imageUrls.length > 0 && imageUrls.some((u) => typeof u !== "string" || !u.startsWith("http"))) {
    return { ok: false, formError: t("errors.invalidImages") };
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
 * Positional args so `imageUrls` is not lost to RSC/server-action object field edge cases.
 * Upload client must still pass the same Supabase public URLs as `getPublicUrl`.
 */
export async function createFeedPostWithImages(
  body: string,
  location: string,
  imageUrls: unknown,
): Promise<CreateFeedPostState> {
  const t = await getTranslations("feedPost");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, formError: t("errors.unauthorized") };
  }

  return runCreateFeedPost(supabase, user.id, t, body, location, imageUrls);
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
