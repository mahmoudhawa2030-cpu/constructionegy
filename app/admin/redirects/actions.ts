"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const STATUS_CODES = [301, 302, 307, 308] as const;

const pathSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .regex(/^\//, "must-start-with-slash");

export type RedirectActionState = { ok: true; message?: string } | { ok: false; message: string };

function normalizeDestination(raw: string): string {
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

export async function createRedirectFromForm(
  _prev: RedirectActionState | null,
  formData: FormData,
): Promise<RedirectActionState> {
  await requireAdmin();
  const t = await getTranslations("adminRedirects");
  const supabase = await createClient();

  const sourceRaw = String(formData.get("source_path") ?? "");
  const destinationRaw = String(formData.get("destination_path") ?? "");
  const statusCode = Number.parseInt(String(formData.get("status_code") ?? "301"), 10);
  const isActive = formData.get("is_active") === "on";

  const sourceParsed = pathSchema.safeParse(sourceRaw);
  if (!sourceParsed.success) {
    return { ok: false, message: t("errorSourceInvalid") };
  }
  if (destinationRaw.trim().length === 0) {
    return { ok: false, message: t("errorDestinationRequired") };
  }
  if (!STATUS_CODES.includes(statusCode as (typeof STATUS_CODES)[number])) {
    return { ok: false, message: t("errorStatusInvalid") };
  }

  const destination = normalizeDestination(destinationRaw);
  if (destination === sourceParsed.data) {
    return { ok: false, message: t("errorSameAsSource") };
  }

  const { error } = await supabase.from("redirects").insert({
    source_path: sourceParsed.data,
    destination_path: destination,
    status_code: statusCode,
    is_active: isActive,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: t("errorDuplicate") };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/redirects");
  return { ok: true, message: t("created") };
}

export async function updateRedirectFromForm(
  _prev: RedirectActionState | null,
  formData: FormData,
): Promise<RedirectActionState> {
  await requireAdmin();
  const t = await getTranslations("adminRedirects");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: t("errorInvalidId") };

  const sourceRaw = String(formData.get("source_path") ?? "");
  const destinationRaw = String(formData.get("destination_path") ?? "");
  const statusCode = Number.parseInt(String(formData.get("status_code") ?? "301"), 10);
  const isActive = formData.get("is_active") === "on";

  const sourceParsed = pathSchema.safeParse(sourceRaw);
  if (!sourceParsed.success) {
    return { ok: false, message: t("errorSourceInvalid") };
  }
  if (destinationRaw.trim().length === 0) {
    return { ok: false, message: t("errorDestinationRequired") };
  }
  if (!STATUS_CODES.includes(statusCode as (typeof STATUS_CODES)[number])) {
    return { ok: false, message: t("errorStatusInvalid") };
  }

  const destination = normalizeDestination(destinationRaw);

  const { error } = await supabase
    .from("redirects")
    .update({
      source_path: sourceParsed.data,
      destination_path: destination,
      status_code: statusCode,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: t("errorDuplicate") };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/redirects");
  return { ok: true, message: t("saved") };
}

export async function deleteRedirectFromForm(
  _prev: RedirectActionState | null,
  formData: FormData,
): Promise<RedirectActionState> {
  await requireAdmin();
  const t = await getTranslations("adminRedirects");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: t("errorInvalidId") };

  const { error } = await supabase.from("redirects").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/redirects");
  return { ok: true, message: t("deleted") };
}
