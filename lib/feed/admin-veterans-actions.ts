"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { getCurrentProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SetVeteransCornerState = { ok: true } | { ok: false; message: string };

export async function setFeedPostVeteransCorner(postId: string, enabled: boolean): Promise<SetVeteransCornerState> {
  const t = await getTranslations("adminVeteransCorner");
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile?.is_admin) {
    return { ok: false, message: t("unauthorized") };
  }

  const id = typeof postId === "string" ? postId.trim() : "";
  if (!UUID_RE.test(id)) {
    return { ok: false, message: t("invalidId") };
  }

  const supabase = await createClient();
  const { data: post, error: fetchErr } = await supabase
    .from("feed_posts")
    .select("id,status,user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !post) {
    return { ok: false, message: t("notFound") };
  }
  if (post.status !== "published") {
    return { ok: false, message: t("notPublished") };
  }

  const { error } = await supabase.from("feed_posts").update({ is_veterans_corner: enabled }).eq("id", id);

  if (error) {
    return { ok: false, message: t("updateFailed") };
  }

  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
  revalidatePath("/admin/veterans-corner");
  return { ok: true };
}
