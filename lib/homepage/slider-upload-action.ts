"use server";

import { randomUUID } from "node:crypto";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "homepage-hero-images";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024;

function extFromMime(contentType: string): string | null {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return null;
  }
}

export type SliderUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadSliderImageAction(formData: FormData): Promise<SliderUploadResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return { ok: false, error: "No file provided" };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Unsupported file type" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File too large (max 4MB)" };
  }

  const ext = extFromMime(file.type);
  if (!ext) {
    return { ok: false, error: "Unsupported file type" };
  }

  const supabase = await createClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const path = `slider/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
