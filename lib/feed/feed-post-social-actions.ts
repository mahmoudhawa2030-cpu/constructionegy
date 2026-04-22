"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type SocialActionResult =
  | { ok: true; submittedBody?: string; submittedParentId?: string | null }
  | { ok: false; message: string };

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

  // Robust recount: use RPC first, then fallback to direct count+update (bypasses any RPC/trigger issues)
  const { error: rpcError } = await supabase.rpc("feed_post_recount", { p_post_id: postId });
  if (rpcError) {
    const { count: likeCount, error: countError } = await supabase
      .from("feed_post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (!countError && likeCount !== null) {
      await supabase
        .from("feed_posts")
        .update({ like_count: likeCount })
        .eq("id", postId);
    }
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

export async function addFeedPostComment(
  postId: string,
  rawBody: unknown,
  parentId?: string | null,
): Promise<SocialActionResult> {
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

  const insertPayload: Record<string, unknown> = {
    post_id: postId,
    user_id: user.id,
    body: parsed.data,
  };
  if (parentId) insertPayload.parent_id = parentId;

  const { error } = await supabase.from("feed_post_comments").insert(insertPayload as never);

  if (error) {
    return { ok: false, message: t("social.genericError") };
  }

  // Robust recount: use RPC first, then fallback to direct count+update (bypasses any RPC/trigger issues)
  const { error: rpcError } = await supabase.rpc("feed_post_recount", { p_post_id: postId });
  if (rpcError) {
    // Fallback: count comments directly and update feed_posts (works even without RPC/triggers)
    const { count: commentCount, error: countError } = await supabase
      .from("feed_post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (!countError && commentCount !== null) {
      await supabase
        .from("feed_posts")
        .update({ comment_count: commentCount })
        .eq("id", postId);
    }
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  return { ok: true, submittedBody: parsed.data, submittedParentId: parentId ?? null };
}
