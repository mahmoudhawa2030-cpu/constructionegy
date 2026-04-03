"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { createFeedPostSchema } from "@/lib/feed/post-schema";
import { createClient } from "@/lib/supabase/server";

export type CreateFeedPostState =
  | { ok: true; id: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: { title?: string; body?: string; location?: string };
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
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    location: String(formData.get("location") ?? ""),
  };

  const parsed = createFeedPostSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: { title?: string; body?: string; location?: string } = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      const msg = issue.message as
        | "titleRequired"
        | "titleTooLong"
        | "bodyRequired"
        | "bodyTooLong"
        | "locationTooLong";
      if (path === "title") fieldErrors.title = t(`errors.${msg}`);
      else if (path === "body") fieldErrors.body = t(`errors.${msg}`);
      else if (path === "location") fieldErrors.location = t(`errors.${msg}`);
    }
    return { ok: false, fieldErrors };
  }

  const { title, body, location } = parsed.data;

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      user_id: user.id,
      title,
      body,
      location,
      images: [],
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
