"use client";

import { uploadFeedPostImageAction } from "@/lib/feed/feed-post-image-upload-action";
import { compressImageForUpload } from "@/lib/images/compress-image-client";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
/** Keep under Vercel ~4.5 MB request limits and bucket policy (5 MB). */
const MAX_BYTES = 4 * 1024 * 1024;

export type FeedImageUploadErrorKind = "type" | "size" | "upload" | "auth";

/**
 * Compress on the client, then upload each file via a small server action (cookie auth).
 */
export async function uploadFeedPostImagesFromBrowser(files: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) throw new Error("type");
    if (file.size > MAX_BYTES) throw new Error("size");

    const prepared = await compressImageForUpload(file);
    if (prepared.size > MAX_BYTES) throw new Error("size");

    const body = new FormData();
    body.append("file", prepared, prepared.name || "photo.jpg");

    const result = await uploadFeedPostImageAction(body);
    if (!result.ok) {
      if (result.code === "unauthorized") throw new Error("auth");
      if (result.code === "bad_input") throw new Error("type");
      throw new Error("upload");
    }
    urls.push(result.url);
  }

  return urls;
}

export function isAllowedFeedImageFile(file: File): boolean {
  return ALLOWED.has(file.type) && file.size <= MAX_BYTES;
}
