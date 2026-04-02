"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { isHomepageIconKey } from "@/lib/homepage/icons";
import { createClient } from "@/lib/supabase/server";

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, "Invalid slug.");

const uuid = z.string().uuid();

export type HomepageAdminActionState = { ok: true; message?: string } | { ok: false; message: string };

function hrefNormalize(raw: string): string {
  const s = raw.trim();
  if (s.length === 0) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

export async function createHomepageSectionAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const sp = slugSchema.safeParse(String(formData.get("slug") ?? ""));
  if (!sp.success) {
    return { ok: false, message: t("invalidSlug") };
  }

  const section_type = String(formData.get("section_type") ?? "grid");
  if (section_type !== "carousel" && section_type !== "grid") {
    return { ok: false, message: t("invalidType") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const { error } = await supabase.from("homepage_sections").insert({
    slug: sp.data,
    section_type,
    sort_order,
    enabled,
    title_ar: String(formData.get("title_ar") ?? "").trim() || null,
    title_en: String(formData.get("title_en") ?? "").trim() || null,
    subtitle_ar: String(formData.get("subtitle_ar") ?? "").trim() || null,
    subtitle_en: String(formData.get("subtitle_en") ?? "").trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: t("slugTaken") };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true, message: t("sectionCreated") };
}

export async function updateHomepageSectionAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const sp = slugSchema.safeParse(String(formData.get("slug") ?? ""));
  if (!sp.success) {
    return { ok: false, message: t("invalidSlug") };
  }

  const section_type = String(formData.get("section_type") ?? "grid");
  if (section_type !== "carousel" && section_type !== "grid") {
    return { ok: false, message: t("invalidType") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const { error } = await supabase
    .from("homepage_sections")
    .update({
      slug: sp.data,
      section_type,
      sort_order,
      enabled,
      title_ar: String(formData.get("title_ar") ?? "").trim() || null,
      title_en: String(formData.get("title_en") ?? "").trim() || null,
      subtitle_ar: String(formData.get("subtitle_ar") ?? "").trim() || null,
      subtitle_en: String(formData.get("subtitle_en") ?? "").trim() || null,
    })
    .eq("id", idParsed.data);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: t("slugTaken") };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  revalidatePath(`/admin/homepage/${idParsed.data}`);
  revalidatePath("/");
  return { ok: true, message: t("sectionSaved") };
}

export async function deleteHomepageSectionAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const { error } = await supabase.from("homepage_sections").delete().eq("id", idParsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true, message: t("sectionDeleted") };
}

export async function createHomepageItemAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const sid = uuid.safeParse(String(formData.get("section_id") ?? ""));
  if (!sid.success) {
    return { ok: false, message: t("invalidId") };
  }

  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  if (title_ar.length < 1 && title_en.length < 1) {
    return { ok: false, message: t("titleRequired") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const catRaw = String(formData.get("category_slug") ?? "").trim();
  let category_slug: string | null = null;
  if (catRaw) {
    const cp = slugSchema.safeParse(catRaw);
    if (!cp.success) {
      return { ok: false, message: t("invalidCategorySlug") };
    }
    category_slug = cp.data;
  }

  const iconRaw = String(formData.get("icon_key") ?? "").trim();
  let icon_key: string | null = null;
  if (iconRaw) {
    if (!isHomepageIconKey(iconRaw)) {
      return { ok: false, message: t("invalidIconKey") };
    }
    icon_key = iconRaw;
  }

  const href = category_slug
    ? `/gallery?category=${encodeURIComponent(category_slug)}`
    : hrefNormalize(String(formData.get("href") ?? ""));
  const badgeRaw = String(formData.get("badge_count") ?? "").trim();
  let badge_count: number | null = null;
  if (badgeRaw.length > 0) {
    const n = Number(badgeRaw);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return { ok: false, message: t("invalidBadge") };
    }
    badge_count = n;
  }

  const { error } = await supabase.from("homepage_section_items").insert({
    section_id: sid.data,
    sort_order,
    enabled,
    title_ar: title_ar || title_en,
    title_en: title_en || title_ar,
    description_ar: String(formData.get("description_ar") ?? "").trim() || null,
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    href,
    category_slug,
    icon_emoji: String(formData.get("icon_emoji") ?? "").trim() || null,
    icon_key,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    badge_count,
    badge_label_ar: String(formData.get("badge_label_ar") ?? "").trim() || null,
    badge_label_en: String(formData.get("badge_label_en") ?? "").trim() || null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  revalidatePath(`/admin/homepage/${sid.data}`);
  revalidatePath("/");
  return { ok: true, message: t("itemCreated") };
}

export async function updateHomepageItemAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const title_ar = String(formData.get("title_ar") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  if (title_ar.length < 1 && title_en.length < 1) {
    return { ok: false, message: t("titleRequired") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const catRaw = String(formData.get("category_slug") ?? "").trim();
  let category_slug: string | null = null;
  if (catRaw) {
    const cp = slugSchema.safeParse(catRaw);
    if (!cp.success) {
      return { ok: false, message: t("invalidCategorySlug") };
    }
    category_slug = cp.data;
  }

  const iconRaw = String(formData.get("icon_key") ?? "").trim();
  let icon_key: string | null = null;
  if (iconRaw) {
    if (!isHomepageIconKey(iconRaw)) {
      return { ok: false, message: t("invalidIconKey") };
    }
    icon_key = iconRaw;
  }

  const href = category_slug
    ? `/gallery?category=${encodeURIComponent(category_slug)}`
    : hrefNormalize(String(formData.get("href") ?? ""));
  const badgeRaw = String(formData.get("badge_count") ?? "").trim();
  let badge_count: number | null = null;
  if (badgeRaw.length > 0) {
    const n = Number(badgeRaw);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return { ok: false, message: t("invalidBadge") };
    }
    badge_count = n;
  }

  const { data: row, error: readErr } = await supabase
    .from("homepage_section_items")
    .select("section_id")
    .eq("id", idParsed.data)
    .maybeSingle();

  if (readErr || !row) {
    return { ok: false, message: t("notFound") };
  }

  const { error } = await supabase
    .from("homepage_section_items")
    .update({
      sort_order,
      enabled,
      title_ar: title_ar || title_en,
      title_en: title_en || title_ar,
      description_ar: String(formData.get("description_ar") ?? "").trim() || null,
      description_en: String(formData.get("description_en") ?? "").trim() || null,
      href,
      category_slug,
      icon_emoji: String(formData.get("icon_emoji") ?? "").trim() || null,
      icon_key,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      badge_count,
      badge_label_ar: String(formData.get("badge_label_ar") ?? "").trim() || null,
      badge_label_en: String(formData.get("badge_label_en") ?? "").trim() || null,
    })
    .eq("id", idParsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  revalidatePath(`/admin/homepage/${row.section_id}`);
  revalidatePath("/");
  return { ok: true, message: t("itemSaved") };
}

export async function deleteHomepageItemAction(
  _prev: HomepageAdminActionState | null,
  formData: FormData,
): Promise<HomepageAdminActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.actions");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const { data: row } = await supabase
    .from("homepage_section_items")
    .select("section_id")
    .eq("id", idParsed.data)
    .maybeSingle();

  const { error } = await supabase.from("homepage_section_items").delete().eq("id", idParsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/homepage");
  if (row?.section_id) {
    revalidatePath(`/admin/homepage/${row.section_id}`);
  }
  revalidatePath("/");
  return { ok: true, message: t("itemDeleted") };
}
