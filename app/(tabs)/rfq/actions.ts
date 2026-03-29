"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createSupplierBidDraft } from "@/lib/rfq/bid-service";
import {
  getLegalCompanyNameFromDraftMetadata,
  RFQ_LEGAL_COMPANY_NAME_MAX,
  RFQ_LEGAL_COMPANY_NAME_MIN,
} from "@/lib/rfq/domain";
import { updateRfqDraftForOwner } from "@/lib/rfq/draft-service";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

const UUID = z.string().uuid();

export type RfqDraftUiActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function saveRfqDraftTitleAction(
  _prev: RfqDraftUiActionState | null,
  formData: FormData,
): Promise<RfqDraftUiActionState> {
  const t = await getTranslations("rfqDraft.actions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("unauthorized") };
  }
  if (!(await canAccessFeature(user.id, "rfq"))) {
    return { ok: false, message: t("subscriptionRequired") };
  }

  const draftId = String(formData.get("draft_id") ?? "").trim();
  const parsedId = UUID.safeParse(draftId);
  if (!parsedId.success) {
    return { ok: false, message: t("invalidDraft") };
  }

  const raw = String(formData.get("title") ?? "").trim();
  if (raw.length > 500) {
    return { ok: false, message: t("titleTooLong") };
  }
  const title = raw.length === 0 ? null : raw;

  const updated = await updateRfqDraftForOwner(supabase, parsedId.data, user.id, { title });
  if (!updated.ok) {
    return { ok: false, message: t("saveFailed") };
  }

  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  return { ok: true, message: t("savedTitle") };
}

export async function saveRfqLegalCompanyNameAction(
  _prev: RfqDraftUiActionState | null,
  formData: FormData,
): Promise<RfqDraftUiActionState> {
  const t = await getTranslations("rfqDraft.actions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("unauthorized") };
  }
  if (!(await canAccessFeature(user.id, "rfq"))) {
    return { ok: false, message: t("subscriptionRequired") };
  }

  const draftId = String(formData.get("draft_id") ?? "").trim();
  const parsedId = UUID.safeParse(draftId);
  if (!parsedId.success) {
    return { ok: false, message: t("invalidDraft") };
  }

  const raw = String(formData.get("legal_company_name") ?? "").trim();
  if (raw.length < RFQ_LEGAL_COMPANY_NAME_MIN) {
    return { ok: false, message: t("legalCompanyInvalid") };
  }
  if (raw.length > RFQ_LEGAL_COMPANY_NAME_MAX) {
    return { ok: false, message: t("legalCompanyTooLong") };
  }

  const { data: row, error } = await supabase
    .from("rfq_drafts")
    .select("id, user_id, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false, message: t("notFound") };
  }
  if (row.status !== "draft") {
    return { ok: false, message: t("alreadyPublished") };
  }

  const updated = await updateRfqDraftForOwner(supabase, parsedId.data, user.id, {
    metadata: { legal_company_name: raw },
  });
  if (!updated.ok) {
    return { ok: false, message: t("legalCompanySaveFailed") };
  }

  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  return { ok: true, message: t("legalCompanySaved") };
}

export async function submitRfqDraftForBidsAction(
  _prev: RfqDraftUiActionState | null,
  formData: FormData,
): Promise<RfqDraftUiActionState> {
  const t = await getTranslations("rfqDraft.actions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("unauthorized") };
  }
  if (!(await canAccessFeature(user.id, "rfq"))) {
    return { ok: false, message: t("subscriptionRequired") };
  }

  const draftId = String(formData.get("draft_id") ?? "").trim();
  const parsedId = UUID.safeParse(draftId);
  if (!parsedId.success) {
    return { ok: false, message: t("invalidDraft") };
  }

  const { data: row, error } = await supabase
    .from("rfq_drafts")
    .select("id, user_id, status, metadata")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false, message: t("notFound") };
  }
  if (row.status !== "draft") {
    return { ok: false, message: t("alreadyPublished") };
  }

  const legalName = getLegalCompanyNameFromDraftMetadata(row.metadata);
  if (legalName.length < RFQ_LEGAL_COMPANY_NAME_MIN) {
    return { ok: false, message: t("legalCompanyRequiredBeforePublish") };
  }

  const { error: upErr } = await supabase
    .from("rfq_drafts")
    .update({ status: "open_for_bids", updated_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (upErr) {
    return { ok: false, message: t("publishFailed") };
  }

  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${parsedId.data}`);
  return { ok: true, message: t("published") };
}

export type RfqBidActionState = RfqDraftUiActionState;

export async function createRfqBidDraftAction(
  _prev: RfqBidActionState | null,
  formData: FormData,
): Promise<RfqBidActionState> {
  const t = await getTranslations("rfqOpportunity.bidActions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: t("unauthorized") };
  }
  if (!(await canAccessFeature(user.id, "rfq"))) {
    return { ok: false, message: t("subscriptionRequired") };
  }

  const draftId = String(formData.get("draft_id") ?? "").trim();
  const parsedId = UUID.safeParse(draftId);
  if (!parsedId.success) {
    return { ok: false, message: t("invalidDraft") };
  }

  const notes = String(formData.get("supplier_notes") ?? "").trim() || null;
  const amountRaw = String(formData.get("total_amount") ?? "").trim();
  let total_amount: number | null = null;
  if (amountRaw.length > 0) {
    const n = Number(amountRaw);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, message: t("invalidAmount") };
    }
    total_amount = n;
  }

  const created = await createSupplierBidDraft(supabase, user.id, parsedId.data, {
    supplier_notes: notes,
    total_amount,
    currency: "EGP",
  });

  if (!created.ok) {
    if (created.code === "BID_ALREADY_EXISTS") {
      return { ok: false, message: t("bidExists") };
    }
    return { ok: false, message: t("bidFailed") };
  }

  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${parsedId.data}`);
  return { ok: true, message: t("bidSaved") };
}
