"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { createSupplierBidDraft } from "@/lib/rfq/bid-service";
import { parseClosingDateLocalToIso } from "@/lib/rfq/closing-date";
import { persistBidAttachmentFiles } from "@/lib/rfq/persist-bid-attachments";
import { updateRfqDraftForOwner } from "@/lib/rfq/draft-service";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

const UUID = z.string().uuid();

const RFQ_TITLE_MAX = 500;
const RFQ_LOCATION_MAX = 500;
const RFQ_DESC_MAX_CHARS = 15_000;
const RFQ_DESC_MAX_WORDS = 3000;

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function validateDescription(description: string, t: (key: string) => string): string | null {
  if (description.length > RFQ_DESC_MAX_CHARS) {
    return t("descriptionTooLong");
  }
  if (countWords(description) > RFQ_DESC_MAX_WORDS) {
    return t("descriptionTooLong");
  }
  return null;
}

export type RfqDraftUiActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function saveRfqDraftDetailsAction(
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
    .select("id, user_id, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false, message: t("notFound") };
  }
  if (row.status !== "draft") {
    return { ok: false, message: t("fieldsLocked") };
  }

  const titleRaw = String(formData.get("title") ?? "").trim();
  if (titleRaw.length > RFQ_TITLE_MAX) {
    return { ok: false, message: t("titleTooLong") };
  }
  const title = titleRaw.length === 0 ? null : titleRaw;

  const description = String(formData.get("description") ?? "").trim();
  const descErr = validateDescription(description, t);
  if (descErr) {
    return { ok: false, message: descErr };
  }

  const locationRaw = String(formData.get("location") ?? "").trim();
  if (locationRaw.length > RFQ_LOCATION_MAX) {
    return { ok: false, message: t("invalidLocation") };
  }
  const location = locationRaw.length === 0 ? null : locationRaw;

  const closingRaw = String(formData.get("closing_date") ?? "").trim();
  let closing_date: string | null = null;
  if (closingRaw.length > 0) {
    const iso = parseClosingDateLocalToIso(closingRaw);
    if (!iso) {
      return { ok: false, message: t("invalidDate") };
    }
    closing_date = iso;
  }

  const updated = await updateRfqDraftForOwner(supabase, parsedId.data, user.id, {
    title,
    description: description.length === 0 ? null : description,
    location,
    closing_date,
  });
  if (!updated.ok) {
    return { ok: false, message: t("saveFailed") };
  }

  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  return { ok: true, message: t("saved") };
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
    .select("id, user_id, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false, message: t("notFound") };
  }
  if (row.status !== "draft") {
    return { ok: false, message: t("alreadyPublished") };
  }

  const titleRaw = String(formData.get("title") ?? "").trim();
  if (titleRaw.length === 0) {
    return { ok: false, message: t("missingTitleForPublish") };
  }
  if (titleRaw.length > RFQ_TITLE_MAX) {
    return { ok: false, message: t("titleTooLong") };
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length === 0) {
    return { ok: false, message: t("missingDescriptionForPublish") };
  }
  const descErr = validateDescription(description, t);
  if (descErr) {
    return { ok: false, message: descErr };
  }

  const locationRaw = String(formData.get("location") ?? "").trim();
  if (locationRaw.length === 0) {
    return { ok: false, message: t("invalidLocation") };
  }
  if (locationRaw.length > RFQ_LOCATION_MAX) {
    return { ok: false, message: t("invalidLocation") };
  }

  const closingRaw = String(formData.get("closing_date") ?? "").trim();
  if (closingRaw.length === 0) {
    return { ok: false, message: t("missingClosingForPublish") };
  }
  const closingIso = parseClosingDateLocalToIso(closingRaw);
  if (!closingIso) {
    return { ok: false, message: t("invalidDate") };
  }
  const closingDate = new Date(closingIso);
  if (Number.isNaN(closingDate.getTime()) || closingDate.getTime() <= Date.now()) {
    return { ok: false, message: t("invalidDate") };
  }

  const updated = await updateRfqDraftForOwner(supabase, parsedId.data, user.id, {
    title: titleRaw,
    description,
    location: locationRaw,
    closing_date: closingIso,
    status: "open_for_bids",
  });
  if (!updated.ok) {
    return { ok: false, message: t("publishFailed") };
  }

  revalidatePath("/");
  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${parsedId.data}`);
  return { ok: true, message: t("published") };
}

export type RfqBidActionState = RfqDraftUiActionState;

function bidFilesFromFormData(formData: FormData): File[] {
  return formData.getAll("bid_files").filter((v): v is File => typeof File !== "undefined" && v instanceof File);
}

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

  const files = bidFilesFromFormData(formData);

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

  if (files.length > 0) {
    const persisted = await persistBidAttachmentFiles(supabase, user.id, created.bidId, files);
    if (!persisted.ok) {
      revalidatePath("/rfq/opportunities");
      revalidatePath(`/rfq/opportunities/${parsedId.data}`);
      return { ok: false, message: t("bidFilesPartialFail") };
    }
  }

  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${parsedId.data}`);
  revalidatePath("/rfq");
  return { ok: true, message: t("bidSaved") };
}

export async function addRfqBidDraftAttachmentsAction(
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

  const bidId = String(formData.get("bid_id") ?? "").trim();
  const parsedBid = UUID.safeParse(bidId);
  if (!parsedBid.success) {
    return { ok: false, message: t("invalidBid") };
  }

  const files = bidFilesFromFormData(formData);
  if (files.length === 0) {
    return { ok: false, message: t("noBidFiles") };
  }

  const { data: bid, error: bidErr } = await supabase
    .from("rfq_bids")
    .select("id, supplier_user_id, status, draft_id")
    .eq("id", parsedBid.data)
    .maybeSingle();

  if (bidErr || !bid || bid.supplier_user_id !== user.id) {
    return { ok: false, message: t("invalidBid") };
  }
  if (bid.status !== "draft") {
    return { ok: false, message: t("bidNotEditable") };
  }

  const persisted = await persistBidAttachmentFiles(supabase, user.id, bid.id, files);
  if (!persisted.ok) {
    return { ok: false, message: t("uploadFailed") };
  }

  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${bid.draft_id}`);
  revalidatePath("/rfq");
  return { ok: true, message: t("attachmentsAdded") };
}

export async function reopenRfqAction(
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
    .select("id, user_id, status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error || !row || row.user_id !== user.id) {
    return { ok: false, message: t("notFound") };
  }
  if (row.status !== "closed") {
    return { ok: false, message: t("reopenWrongStatus") };
  }

  const { error: upErr } = await supabase
    .from("rfq_drafts")
    .update({ status: "open_for_bids", updated_at: new Date().toISOString() })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (upErr) {
    return { ok: false, message: t("reopenFailed") };
  }

  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  revalidatePath(`/rfq/opportunities/${parsedId.data}`);
  return { ok: true, message: t("reopened") };
}
