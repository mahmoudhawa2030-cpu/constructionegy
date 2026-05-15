"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { RFQ_LEGAL_COMPANY_NAME_MAX, RFQ_LEGAL_COMPANY_NAME_MIN } from "@/lib/rfq/domain";
import { createClient } from "@/lib/supabase/server";

export type ProfileLegalNameActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function saveProfileLegalCompanyNameAction(
  _prev: ProfileLegalNameActionState | null,
  formData: FormData,
): Promise<ProfileLegalNameActionState> {
  const t = await getTranslations("businessVerification.actions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("unauthorized") };
  }

  const raw = String(formData.get("legal_company_name") ?? "").trim();
  if (raw.length < RFQ_LEGAL_COMPANY_NAME_MIN) {
    return { ok: false, message: t("legalCompanyTooShort") };
  }
  if (raw.length > RFQ_LEGAL_COMPANY_NAME_MAX) {
    return { ok: false, message: t("legalCompanyTooLong") };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ legal_company_name: raw, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: t("saveFailed") };
  }

  revalidatePath("/profile");
  return { ok: true, message: t("legalCompanySaved") };
}
