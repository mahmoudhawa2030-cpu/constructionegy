"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const applySchema = z.object({
  credentials_summary: z.string().trim().min(20, "short").max(2000, "long"),
});

export type ExpertVerificationApplyState = { ok: true; message: string } | { ok: false; message: string };

export async function submitExpertVerificationApplicationAction(
  _prev: ExpertVerificationApplyState | null,
  formData: FormData,
): Promise<ExpertVerificationApplyState> {
  const t = await getTranslations("expertVerification.apply");
  const te = await getTranslations("expertVerification.apply.errors");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: te("unauthorized") };
  }

  const parsed = applySchema.safeParse({
    credentials_summary: String(formData.get("credentials_summary") ?? ""),
  });
  if (!parsed.success) {
    const issue = parsed.error.flatten().fieldErrors.credentials_summary?.[0];
    if (issue === "short") return { ok: false, message: te("summaryTooShort") };
    if (issue === "long") return { ok: false, message: te("summaryTooLong") };
    return { ok: false, message: te("invalid") };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("profiles")
    .select("expert_verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, message: te("loadFailed") };
  }

  const st = existing.expert_verification_status;
  if (st !== "none" && st !== "rejected") {
    return { ok: false, message: te("notApplicable") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      expert_credentials_summary: parsed.data.credentials_summary,
      expert_verification_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: te("saveFailed") };
  }

  revalidatePath("/profile");
  return { ok: true, message: t("success") };
}
