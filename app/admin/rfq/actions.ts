"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const UUID = z.string().uuid();

const RFQ_DRAFT_STATUS = z.enum([
  "draft",
  "submitted",
  "open_for_bids",
  "closed",
  "archived",
  "awarded",
]);

const RFQ_BID_STATUS = z.enum(["draft", "submitted", "withdrawn", "accepted", "rejected"]);

export type AdminRfqActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function adminUpdateRfqDraftStatusAction(
  _prev: AdminRfqActionState | null,
  formData: FormData,
): Promise<AdminRfqActionState> {
  const t = await getTranslations("adminRfq.actions");
  await requireAdmin();
  const supabase = await createClient();

  const draftId = UUID.safeParse(String(formData.get("draft_id") ?? "").trim());
  if (!draftId.success) {
    return { ok: false, message: t("invalidDraft") };
  }

  const statusParsed = RFQ_DRAFT_STATUS.safeParse(String(formData.get("status") ?? "").trim());
  if (!statusParsed.success) {
    return { ok: false, message: t("invalidStatus") };
  }

  const noteRaw = String(formData.get("moderation_note") ?? "").trim().slice(0, 2000);

  const { data: existing, error: readErr } = await supabase
    .from("rfq_drafts")
    .select("metadata")
    .eq("id", draftId.data)
    .maybeSingle();

  if (readErr || !existing) {
    return { ok: false, message: t("notFound") };
  }

  const prevMeta =
    existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const metadata: Json = {
    ...prevMeta,
    ...(noteRaw.length > 0
      ? {
          admin_moderation_note: noteRaw,
          admin_moderation_note_at: new Date().toISOString(),
        }
      : {}),
  };

  const { error } = await supabase
    .from("rfq_drafts")
    .update({
      status: statusParsed.data,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/rfq");
  revalidatePath(`/admin/rfq/${draftId.data}`);
  revalidatePath("/rfq");
  revalidatePath("/rfq/opportunities");
  return { ok: true, message: t("draftUpdated") };
}

export async function adminUpdateRfqBidStatusAction(
  _prev: AdminRfqActionState | null,
  formData: FormData,
): Promise<AdminRfqActionState> {
  const t = await getTranslations("adminRfq.actions");
  await requireAdmin();
  const supabase = await createClient();

  const bidId = UUID.safeParse(String(formData.get("bid_id") ?? "").trim());
  if (!bidId.success) {
    return { ok: false, message: t("invalidBid") };
  }

  const statusParsed = RFQ_BID_STATUS.safeParse(String(formData.get("status") ?? "").trim());
  if (!statusParsed.success) {
    return { ok: false, message: t("invalidBidStatus") };
  }

  const { data: bid, error: readErr } = await supabase.from("rfq_bids").select("id, draft_id").eq("id", bidId.data).maybeSingle();

  if (readErr || !bid) {
    return { ok: false, message: t("bidNotFound") };
  }

  const { error } = await supabase
    .from("rfq_bids")
    .update({ status: statusParsed.data, updated_at: new Date().toISOString() })
    .eq("id", bidId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/rfq");
  revalidatePath(`/admin/rfq/${bid.draft_id}`);
  return { ok: true, message: t("bidUpdated") };
}
