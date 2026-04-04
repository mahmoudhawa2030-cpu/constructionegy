"use client";

import { createFeedPostSignedUploadUrl } from "@/lib/feed/feed-post-signed-upload";
import { compressImageForUpload } from "@/lib/images/compress-image-client";
import { createClient } from "@/lib/supabase/client";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function extFromFile(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[file.type] ?? "jpg";
}

export type FeedImageUploadErrorKind = "type" | "size" | "upload";

/**
 * Upload to `feed-post-images` via server-issued signed URLs (cookie session), then PUT from the
 * browser with the token so RLS accepts the object even when the anon browser client has no JWT.
 */
export async function uploadFeedPostImagesFromBrowser(files: File[]): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      throw new Error("type");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("size");
    }
    const prepared = await compressImageForUpload(file);
    if (prepared.size > MAX_BYTES) {
      throw new Error("size");
    }
    const ext = extFromFile(prepared);
    const slot = await createFeedPostSignedUploadUrl(ext);
    if (!slot.ok) {
      if (slot.code === "unauthorized") throw new Error("auth");
      if (slot.code === "invalidExt") throw new Error("type");
      throw new Error("upload");
    }

    const { error } = await supabase.storage.from("feed-post-images").uploadToSignedUrl(
      slot.path,
      slot.token,
      prepared,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: prepared.type || "image/jpeg",
      },
    );
    if (error) {
      throw new Error("upload");
    }

    const { data } = supabase.storage.from("feed-post-images").getPublicUrl(slot.path);
    urls.push(data.publicUrl);
  }

  return urls;
}

export function isAllowedFeedImageFile(file: File): boolean {
  return ALLOWED.has(file.type) && file.size <= MAX_BYTES;
}
