"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export type NotFoundActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function dismissNotFoundFromForm(
  _prev: NotFoundActionState | null,
  formData: FormData,
): Promise<NotFoundActionState> {
  await requireAdmin();
  const t = await getTranslations("adminNotFound");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: t("errorInvalidId") };

  const { error } = await supabase.from("not_found_log").update({ ignored: true }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/not-found-log");
  return { ok: true, message: t("dismissed") };
}

export async function deleteNotFoundFromForm(
  _prev: NotFoundActionState | null,
  formData: FormData,
): Promise<NotFoundActionState> {
  await requireAdmin();
  const t = await getTranslations("adminNotFound");
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: t("errorInvalidId") };

  const { error } = await supabase.from("not_found_log").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/not-found-log");
  return { ok: true, message: t("deleted") };
}
