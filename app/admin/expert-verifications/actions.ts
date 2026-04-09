"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = z.string().uuid();

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
