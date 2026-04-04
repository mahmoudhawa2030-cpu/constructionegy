"use server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function mimeFromFilename(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

export type UploadFeedPostImageActionResult =
  | { ok: true; url: string }
  | { ok: false; code: "unauthorized" | "bad_input" | "storage"; message?: string };

/**
 * Upload one feed image using the **server** Supabase client (cookie session).
 * Called once per photo from the client so each multipart body stays small and
 * `serverActions.bodySizeLimit` can fit compressed JPEGs (> default 1 MB).
 */
export async function uploadFeedPostImageAction(formData: FormData): Promise<UploadFeedPostImageActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  const raw = formData.get("file");
  if (!(raw instanceof Blob) || raw.size === 0) {
    return { ok: false, code: "bad_input" };
  }

  if (raw.size > MAX_BYTES) {
    return { ok: false, code: "bad_input" };
  }

  let mime = raw.type;
  if (!ALLOWED_TYPES.has(mime)) {
    const name = raw instanceof File ? raw.name : "";
    const guess = name ? mimeFromFilename(name) : null;
    if (guess && ALLOWED_TYPES.has(guess)) {
      mime = guess;
    } else {
      return { ok: false, code: "bad_input" };
    }
  }

  const ext = EXT_MAP[mime] ?? "jpg";
  const path = `${user.id}/feed/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await raw.arrayBuffer());

  const { error } = await supabase.storage.from("feed-post-images").upload(path, buffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: mime,
  });

  if (error) {
    console.error("[feed-post-image-upload-action] Storage upload error:", error);
    return { ok: false, code: "storage", message: error.message };
  }

  const { data: pub } = supabase.storage.from("feed-post-images").getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}
