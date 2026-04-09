"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = z.string().uuid();

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type AdminManualExpertSearchRow = {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  expert_verification_status: string;
};

export async function adminSearchProfilesForManualExpert(
  rawQuery: string,
): Promise<{ ok: true; rows: AdminManualExpertSearchRow[] } | { ok: false; message: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const q = rawQuery.trim().slice(0, 80);
  if (q.length < 2) {
    return { ok: true, rows: [] };
  }

  const uuidTry = UUID.safeParse(q);
  if (uuidTry.success) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number, expert_verification_status")
      .eq("id", uuidTry.data)
      .maybeSingle();
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, rows: data ? [data as AdminManualExpertSearchRow] : [] };
  }

  const pattern = `%${escapeIlikePattern(q)}%`;

  const [byName, byPhone] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone_number, expert_verification_status")
      .ilike("full_name", pattern)
      .order("full_name", { ascending: true, nullsFirst: false })
      .limit(25),
    supabase
      .from("profiles")
      .select("id, full_name, phone_number, expert_verification_status")
      .ilike("phone_number", pattern)
      .order("full_name", { ascending: true, nullsFirst: false })
      .limit(25),
  ]);

  const err = byName.error ?? byPhone.error;
  if (err) {
    return { ok: false, message: err.message };
  }

  const merged = new Map<string, AdminManualExpertSearchRow>();
  for (const row of [...(byName.data ?? []), ...(byPhone.data ?? [])]) {
    merged.set(row.id, row as AdminManualExpertSearchRow);
  }
  const rows = Array.from(merged.values())
    .sort((a, b) => {
      const an = (a.full_name ?? "").trim() || "\uffff";
      const bn = (b.full_name ?? "").trim() || "\uffff";
      return an.localeCompare(bn, undefined, { sensitivity: "base" });
    })
    .slice(0, 25);

  return { ok: true, rows };
}

export type AdminExpertVerificationActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function adminApproveExpertVerification(
  _prev: AdminExpertVerificationActionState | null,
  formData: FormData,
): Promise<AdminExpertVerificationActionState> {
  const t = await getTranslations("adminExpertVerifications.actions");
  await requireAdmin();
  const supabase = await createClient();

  const userId = UUID.safeParse(String(formData.get("user_id") ?? "").trim());
  if (!userId.success) {
    return { ok: false, message: t("invalidUser") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      expert_verification_status: "verified",
      expert_verification_reviewed_at: new Date().toISOString(),
      expert_verification_admin_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/expert-verifications");
  revalidatePath(`/admin/expert-verifications/${userId.data}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId.data}`);
  revalidatePath("/");
  return { ok: true, message: t("approved") };
}

export async function adminRejectExpertVerification(
  _prev: AdminExpertVerificationActionState | null,
  formData: FormData,
): Promise<AdminExpertVerificationActionState> {
  const t = await getTranslations("adminExpertVerifications.actions");
  await requireAdmin();
  const supabase = await createClient();

  const userId = UUID.safeParse(String(formData.get("user_id") ?? "").trim());
  if (!userId.success) {
    return { ok: false, message: t("invalidUser") };
  }

  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);

  const { error } = await supabase
    .from("profiles")
    .update({
      expert_verification_status: "rejected",
      expert_verification_reviewed_at: new Date().toISOString(),
      expert_verification_admin_notes: notes.length > 0 ? notes : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/expert-verifications");
  revalidatePath(`/admin/expert-verifications/${userId.data}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId.data}`);
  revalidatePath("/");
  return { ok: true, message: t("rejected") };
}

export async function adminGrantExpertManually(
  _prev: AdminExpertVerificationActionState | null,
  formData: FormData,
): Promise<AdminExpertVerificationActionState> {
  const t = await getTranslations("adminExpertVerifications.actions");
  await requireAdmin();
  const supabase = await createClient();

  const userId = UUID.safeParse(String(formData.get("user_id") ?? "").trim());
  if (!userId.success) {
    return { ok: false, message: t("invalidUser") };
  }

  const { data: existing, error: loadErr } = await supabase
    .from("profiles")
    .select("expert_verification_status, is_banned")
    .eq("id", userId.data)
    .maybeSingle();

  if (loadErr) {
    return { ok: false, message: loadErr.message };
  }
  if (!existing) {
    return { ok: false, message: t("userNotFound") };
  }
  if (existing.is_banned) {
    return { ok: false, message: t("userBanned") };
  }
  if (existing.expert_verification_status === "verified") {
    return { ok: true, message: t("alreadyVerified") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      expert_verification_status: "verified",
      expert_verification_reviewed_at: new Date().toISOString(),
      expert_verification_admin_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/expert-verifications");
  revalidatePath(`/admin/expert-verifications/${userId.data}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/${userId.data}`);
  revalidatePath("/");
  return { ok: true, message: t("grantedManually") };
}
