"use server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_EXT = new Set(["jpg", "png", "webp", "gif"]);

export type FeedPostSignedUploadResult =
  | { ok: true; path: string; token: string }
  | { ok: false; code: "unauthorized" | "invalidExt" | "storage" };

/**
 * One signed upload slot per call. Uses the server Supabase client (cookie session) so uploads work
 * even when the browser client does not attach the JWT (common with httpOnly / WebView quirks).
 */
export async function createFeedPostSignedUploadUrl(ext: string): Promise<FeedPostSignedUploadResult> {
  const raw = ext.replace(/^\./, "").toLowerCase();
  const safeExt = raw === "jpeg" ? "jpg" : raw;
  if (!ALLOWED_EXT.has(safeExt)) {
    return { ok: false, code: "invalidExt" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  const path = `${user.id}/feed/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await supabase.storage.from("feed-post-images").createSignedUploadUrl(path);

  if (error || !data?.token) {
    return { ok: false, code: "storage" };
  }

  return { ok: true, path: data.path, token: data.token };
}
