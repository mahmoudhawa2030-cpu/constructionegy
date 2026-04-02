"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { DESKTOP_CATEGORY_ICON_BUCKET } from "@/lib/supabase/desktop-category-icon-url";
import { createClient } from "@/lib/supabase/server";

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, "Invalid slug.");

const uuid = z.string().uuid();

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024;

export type DesktopCategoryCardActionState = { ok: true; message?: string } | { ok: false; message: string };

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

async function uploadCardImage(
  categorySlug: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; key: "imageBadType" | "imageTooBig" | "uploadFailed"; detail?: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, key: "imageBadType" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, key: "imageTooBig" };
  }
  const ext = extFromMime(file.type);
  if (!ext) {
    return { ok: false, key: "imageBadType" };
  }

  const supabase = await createClient();
  const buf = Buffer.from(await file.arrayBuffer());
  const path = `cards/${categorySlug}/${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(DESKTOP_CATEGORY_ICON_BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false, key: "uploadFailed", detail: error.message };
  }
  return { ok: true, path };
}

export async function createDesktopCategoryCardAction(
  _prev: DesktopCategoryCardActionState | null,
  formData: FormData,
): Promise<DesktopCategoryCardActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.desktopCategories");
  const supabase = await createClient();

  const slugParsed = slugSchema.safeParse(String(formData.get("category_slug") ?? ""));
  if (!slugParsed.success) {
    return { ok: false, message: t("invalidSlug") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const { data: cat } = await supabase
    .from("categories")
    .select("slug")
    .eq("slug", slugParsed.data)
    .maybeSingle();
  if (!cat) {
    return { ok: false, message: t("categoryNotFound") };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size < 1) {
    return { ok: false, message: t("imageRequired") };
  }

  const uploaded = await uploadCardImage(slugParsed.data, file);
  if (!uploaded.ok) {
    if (uploaded.key === "uploadFailed") {
      return { ok: false, message: uploaded.detail ?? t("uploadFailed") };
    }
    return { ok: false, message: t(uploaded.key) };
  }

  const { error: insErr } = await supabase.from("homepage_desktop_category_cards").insert({
    category_slug: slugParsed.data,
    image_storage_path: uploaded.path,
    sort_order,
    enabled,
  });

  if (insErr) {
    await supabase.storage.from(DESKTOP_CATEGORY_ICON_BUCKET).remove([uploaded.path]);
    if (insErr.code === "23505") {
      return { ok: false, message: t("slugTaken") };
    }
    return { ok: false, message: insErr.message };
  }

  revalidatePath("/admin/homepage/desktop-categories");
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true, message: t("created") };
}

export async function updateDesktopCategoryCardAction(
  _prev: DesktopCategoryCardActionState | null,
  formData: FormData,
): Promise<DesktopCategoryCardActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.desktopCategories");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const sort_order = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0;
  const enabled = formData.get("enabled") === "on";

  const { data: row, error: readErr } = await supabase
    .from("homepage_desktop_category_cards")
    .select("id, category_slug, image_storage_path")
    .eq("id", idParsed.data)
    .maybeSingle();

  if (readErr || !row) {
    return { ok: false, message: t("notFound") };
  }

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadCardImage(row.category_slug, file);
    if (!uploaded.ok) {
      if (uploaded.key === "uploadFailed") {
        return { ok: false, message: uploaded.detail ?? t("uploadFailed") };
      }
      return { ok: false, message: t(uploaded.key) };
    }
    const oldPath = row.image_storage_path;
    const { error: upErr } = await supabase
      .from("homepage_desktop_category_cards")
      .update({
        image_storage_path: uploaded.path,
        sort_order,
        enabled,
      })
      .eq("id", idParsed.data);

    if (upErr) {
      await supabase.storage.from(DESKTOP_CATEGORY_ICON_BUCKET).remove([uploaded.path]);
      return { ok: false, message: upErr.message };
    }
    await supabase.storage.from(DESKTOP_CATEGORY_ICON_BUCKET).remove([oldPath]);
  } else {
    const { error: upErr } = await supabase
      .from("homepage_desktop_category_cards")
      .update({ sort_order, enabled })
      .eq("id", idParsed.data);

    if (upErr) {
      return { ok: false, message: upErr.message };
    }
  }

  revalidatePath("/admin/homepage/desktop-categories");
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true, message: t("saved") };
}

export async function deleteDesktopCategoryCardAction(
  _prev: DesktopCategoryCardActionState | null,
  formData: FormData,
): Promise<DesktopCategoryCardActionState> {
  await requireAdmin();
  const t = await getTranslations("adminHomepage.desktopCategories");
  const supabase = await createClient();

  const idParsed = uuid.safeParse(String(formData.get("id") ?? ""));
  if (!idParsed.success) {
    return { ok: false, message: t("invalidId") };
  }

  const { data: row } = await supabase
    .from("homepage_desktop_category_cards")
    .select("image_storage_path")
    .eq("id", idParsed.data)
    .maybeSingle();

  const { error } = await supabase.from("homepage_desktop_category_cards").delete().eq("id", idParsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (row?.image_storage_path) {
    await supabase.storage.from(DESKTOP_CATEGORY_ICON_BUCKET).remove([row.image_storage_path]);
  }

  revalidatePath("/admin/homepage/desktop-categories");
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { ok: true, message: t("deleted") };
}
