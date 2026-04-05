"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type SocialActionResult = { ok: true } | { ok: false; message: string };

const commentSchema = z
  .string()
  .trim()
  .min(1, { message: "bodyRequired" })
  .max(2000, { message: "bodyTooLong" });

export async function toggleFeedPostLike(postId: string): Promise<SocialActionResult> {
  const t = await getTranslations("feed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("social.loginRequired") };
  }

  const { data: existing } = await supabase
    .from("feed_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("feed_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { ok: false, message: t("social.genericError") };
  } else {
    const { error } = await supabase.from("feed_post_likes").insert({ post_id: postId, user_id: user.id });
    if (error) return { ok: false, message: t("social.genericError") };
  }

  // Manual fallback in case trigger is missing
  const { count: likeCount, error: countError } = await supabase
    .from("feed_post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (!countError) {
    await supabase
      .from("feed_posts")
      .update({ like_count: likeCount ?? 0 })
      .eq("id", postId);
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}

export async function toggleFeedPostSave(postId: string): Promise<SocialActionResult> {
  const t = await getTranslations("feed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("social.loginRequired") };
  }

  const { data: existing } = await supabase
    .from("feed_post_saves")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("feed_post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { ok: false, message: t("social.genericError") };
  } else {
    const { error } = await supabase.from("feed_post_saves").insert({ post_id: postId, user_id: user.id });
    if (error) return { ok: false, message: t("social.genericError") };
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}

export async function addFeedPostComment(postId: string, rawBody: unknown): Promise<SocialActionResult> {
  const t = await getTranslations("feed");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("social.loginRequired") };
  }

  const parsed = commentSchema.safeParse(typeof rawBody === "string" ? rawBody : "");
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message as "bodyRequired" | "bodyTooLong";
    return { ok: false, message: t(`social.commentErrors.${msg}`) };
  }

  const { error } = await supabase.from("feed_post_comments").insert({
    post_id: postId,
    user_id: user.id,
    body: parsed.data,
  });

  if (error) {
    return { ok: false, message: t("social.genericError") };
  }

  // Manual fallback for comment count (reliable even if trigger missing)
  const { count: commentCount, error: commentCountError } = await supabase
    .from("feed_post_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (!commentCountError) {
    await supabase
      .from("feed_posts")
      .update({ comment_count: commentCount ?? 0 })
      .eq("id", postId);
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { ok: true };
}
