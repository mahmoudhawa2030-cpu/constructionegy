"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getStorageBaseUrl } from "@/lib/supabase/desktop-category-icon-url";
import { WEB_HOME_SECTION_SLUGS } from "@/lib/homepage/web-home-data";

const HERO_IMAGES_BUCKET = "homepage-hero-images";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

function extFromMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png":  return "png";
    case "image/webp": return "webp";
    case "image/gif":  return "gif";
    default: return null;
  }
}

export type UploadImageActionState =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Upload a hero slider image to Supabase Storage.
 * Returns the public URL on success.
 */
export async function uploadHeroImageAction(
  _prev: UploadImageActionState | null,
  formData: FormData,
): Promise<UploadImageActionState> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file provided." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, message: "Only JPEG, PNG, WebP or GIF are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "File is too large (max 4 MB)." };
  }

  const ext = extFromMime(file.type);
  if (!ext) return { ok: false, message: "Unsupported image type." };

  const path = `slider/${randomUUID()}.${ext}`;
  const supabase = await createClient();
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(HERO_IMAGES_BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false });

  if (error) return { ok: false, message: error.message };

  const base = getStorageBaseUrl();
  const url = `${base}/${HERO_IMAGES_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
  return { ok: true, url };
}

const uuid = z.string().uuid();
const slug = z.string().trim().regex(/^[a-z][a-z0-9_]*$/, "Invalid slug.");

export type WebHomepageActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableStr(v: string): string | null {
  return v.length > 0 ? v : null;
}

function nullableInt(raw: string): number | null {
  if (raw.length === 0) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

function normalizeHref(raw: string): string {
  const v = raw.trim();
  if (v.length === 0) return "/";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return v.startsWith("/") ? v : `/${v}`;
}

function revalidateAll() {
  revalidatePath("/admin/homepage");
  revalidatePath("/web");
  revalidatePath("/");
}

/**
 * Toggle a section enabled/disabled.
 */
export async function toggleWebSectionAction(
  _prev: WebHomepageActionState | null,
  formData: FormData,
): Promise<WebHomepageActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = uuid.safeParse(s(formData, "id"));
  if (!id.success) return { ok: false, message: "Invalid section id." };

  const enabled = s(formData, "enabled") === "on";

  const { error } = await supabase
    .from("homepage_sections")
    .update({ enabled })
    .eq("id", id.data);

  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}

/**
 * Update a section's titles/subtitles + sort order.
 */
export async function updateWebSectionAction(
  _prev: WebHomepageActionState | null,
  formData: FormData,
): Promise<WebHomepageActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = uuid.safeParse(s(formData, "id"));
  if (!id.success) return { ok: false, message: "Invalid section id." };

  const sort_order = nullableInt(s(formData, "sort_order")) ?? 0;
  const enabled = s(formData, "enabled") === "on";

  const { error } = await supabase
    .from("homepage_sections")
    .update({
      sort_order,
      enabled,
      title_ar: nullableStr(s(formData, "title_ar")),
      title_en: nullableStr(s(formData, "title_en")),
      subtitle_ar: nullableStr(s(formData, "subtitle_ar")),
      subtitle_en: nullableStr(s(formData, "subtitle_en")),
    })
    .eq("id", id.data);

  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}

/**
 * Universal item create — works for all 6 section types.
 * Each section type only reads the fields it cares about; others are nullable.
 */
export async function createWebItemAction(
  _prev: WebHomepageActionState | null,
  formData: FormData,
): Promise<WebHomepageActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const sid = uuid.safeParse(s(formData, "section_id"));
  if (!sid.success) return { ok: false, message: "Invalid section id." };

  const sectionSlug = s(formData, "section_slug");
  if (!WEB_HOME_SECTION_SLUGS.includes(sectionSlug as never)) {
    return { ok: false, message: "Invalid section slug." };
  }

  const title_ar = s(formData, "title_ar");
  const title_en = s(formData, "title_en");
  if (title_ar.length === 0 && title_en.length === 0) {
    return { ok: false, message: "Title is required (Arabic or English)." };
  }

  const categoryRaw = s(formData, "category_slug");
  let category_slug: string | null = null;
  if (categoryRaw.length > 0) {
    const cp = slug.safeParse(categoryRaw);
    if (!cp.success) return { ok: false, message: "Invalid category slug." };
    category_slug = cp.data;
  }

  // Auto-build href when category is picked
  const rawHref = s(formData, "href");
  const href = category_slug
    ? `/gallery?category=${encodeURIComponent(category_slug)}`
    : normalizeHref(rawHref);

  const listingRaw = s(formData, "listing_id");
  const listing_id = listingRaw.length > 0 && uuid.safeParse(listingRaw).success ? listingRaw : null;

  const supplierRaw = s(formData, "supplier_id");
  const supplier_id = supplierRaw.length > 0 && uuid.safeParse(supplierRaw).success ? supplierRaw : null;

  const { error } = await supabase.from("homepage_section_items").insert({
    section_id: sid.data,
    sort_order: nullableInt(s(formData, "sort_order")) ?? 0,
    enabled: s(formData, "enabled") === "on",
    title_ar: title_ar || title_en,
    title_en: title_en || title_ar,
    description_ar: nullableStr(s(formData, "description_ar")),
    description_en: nullableStr(s(formData, "description_en")),
    kicker_ar: nullableStr(s(formData, "kicker_ar")),
    kicker_en: nullableStr(s(formData, "kicker_en")),
    cta_label_ar: nullableStr(s(formData, "cta_label_ar")),
    cta_label_en: nullableStr(s(formData, "cta_label_en")),
    href,
    category_slug,
    listing_id,
    supplier_id,
    image_url: nullableStr(s(formData, "image_url")),
    icon_emoji: nullableStr(s(formData, "icon_emoji")),
    bg_color: nullableStr(s(formData, "bg_color")),
    fg_color: nullableStr(s(formData, "fg_color")),
    badge_count: nullableInt(s(formData, "badge_count")),
    badge_label_ar: nullableStr(s(formData, "badge_label_ar")),
    badge_label_en: nullableStr(s(formData, "badge_label_en")),
  });

  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}

/**
 * Universal item update.
 */
export async function updateWebItemAction(
  _prev: WebHomepageActionState | null,
  formData: FormData,
): Promise<WebHomepageActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = uuid.safeParse(s(formData, "id"));
  if (!id.success) return { ok: false, message: "Invalid item id." };

  const title_ar = s(formData, "title_ar");
  const title_en = s(formData, "title_en");
  if (title_ar.length === 0 && title_en.length === 0) {
    return { ok: false, message: "Title is required (Arabic or English)." };
  }

  const categoryRaw = s(formData, "category_slug");
  let category_slug: string | null = null;
  if (categoryRaw.length > 0) {
    const cp = slug.safeParse(categoryRaw);
    if (!cp.success) return { ok: false, message: "Invalid category slug." };
    category_slug = cp.data;
  }

  const rawHref = s(formData, "href");
  const href = category_slug
    ? `/gallery?category=${encodeURIComponent(category_slug)}`
    : normalizeHref(rawHref);

  const listingRaw = s(formData, "listing_id");
  const listing_id = listingRaw.length > 0 && uuid.safeParse(listingRaw).success ? listingRaw : null;

  const supplierRaw = s(formData, "supplier_id");
  const supplier_id = supplierRaw.length > 0 && uuid.safeParse(supplierRaw).success ? supplierRaw : null;

  const { error } = await supabase
    .from("homepage_section_items")
    .update({
      sort_order: nullableInt(s(formData, "sort_order")) ?? 0,
      enabled: s(formData, "enabled") === "on",
      title_ar: title_ar || title_en,
      title_en: title_en || title_ar,
      description_ar: nullableStr(s(formData, "description_ar")),
      description_en: nullableStr(s(formData, "description_en")),
      kicker_ar: nullableStr(s(formData, "kicker_ar")),
      kicker_en: nullableStr(s(formData, "kicker_en")),
      cta_label_ar: nullableStr(s(formData, "cta_label_ar")),
      cta_label_en: nullableStr(s(formData, "cta_label_en")),
      href,
      category_slug,
      listing_id,
      supplier_id,
      image_url: nullableStr(s(formData, "image_url")),
      icon_emoji: nullableStr(s(formData, "icon_emoji")),
      bg_color: nullableStr(s(formData, "bg_color")),
      fg_color: nullableStr(s(formData, "fg_color")),
      badge_count: nullableInt(s(formData, "badge_count")),
      badge_label_ar: nullableStr(s(formData, "badge_label_ar")),
      badge_label_en: nullableStr(s(formData, "badge_label_en")),
    })
    .eq("id", id.data);

  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}

/**
 * Universal item delete.
 */
export async function deleteWebItemAction(
  _prev: WebHomepageActionState | null,
  formData: FormData,
): Promise<WebHomepageActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = uuid.safeParse(s(formData, "id"));
  if (!id.success) return { ok: false, message: "Invalid item id." };

  const { error } = await supabase.from("homepage_section_items").delete().eq("id", id.data);
  if (error) return { ok: false, message: error.message };
  revalidateAll();
  return { ok: true };
}
