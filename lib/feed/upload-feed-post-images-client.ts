"use client";

import { compressImageForUpload } from "@/lib/images/compress-image-client";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export type FeedImageUploadErrorKind = "type" | "size" | "upload" | "auth";

/**
 * Compress each file client-side, then POST to /api/feed/upload-image (server
 * handles Supabase Storage with the cookie session — no client JWT needed).
 */
export async function uploadFeedPostImagesFromBrowser(files: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) throw new Error("type");
    if (file.size > MAX_BYTES) throw new Error("size");

    const prepared = await compressImageForUpload(file);
    if (prepared.size > MAX_BYTES) throw new Error("size");

    const body = new FormData();
    body.append("file", prepared);

    const res = await fetch("/api/feed/upload-image", { method: "POST", body });

    if (!res.ok) {
      const json = await res.json().catch(() => ({} as Record<string, unknown>));
      const code = typeof json.error === "string" ? json.error : "";
      if (res.status === 401 || code === "unauthorized") throw new Error("auth");
      if (code === "invalid_type") throw new Error("type");
      if (code === "too_large") throw new Error("size");
      throw new Error("upload");
    }

    const json = (await res.json()) as { url: string };
    if (!json.url) throw new Error("upload");
    urls.push(json.url);
  }

  return urls;
}

export function isAllowedFeedImageFile(file: File): boolean {
  return ALLOWED.has(file.type) && file.size <= MAX_BYTES;
}
