import type { Database, Json } from "@/lib/supabase/database.types";

import type { RfqSupabase } from "./draft-service";

type RfqBidRow = Database["public"]["Tables"]["rfq_bids"]["Row"];

/**
 * Buyer views bids on their RFQ. RLS also allows this; we double-check ownership for APIs.
 */
export async function listRfqBidsForBuyerDraft(
  client: RfqSupabase,
  buyerUserId: string,
  draftId: string,
): Promise<{ ok: true; bids: RfqBidRow[] } | { ok: false; code: "NOT_FOUND" | "LOAD_FAILED"; detail?: string }> {
  const { data: draft, error: dErr } = await client
    .from("rfq_drafts")
    .select("id")
    .eq("id", draftId)
    .eq("user_id", buyerUserId)
    .maybeSingle();

  if (dErr || !draft) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const { data, error } = await client.from("rfq_bids").select("*").eq("draft_id", draftId).order("created_at", {
    ascending: false,
  });

  if (error) {
    return { ok: false, code: "LOAD_FAILED", detail: error.message };
  }
  return { ok: true, bids: data ?? [] };
}

export type SupplierBidInput = {
  supplier_notes?: string | null;
  total_amount?: number | null;
  currency?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Supplier creates a draft bid. Fails with `BID_ALREADY_EXISTS` if this supplier already bid on the RFQ.
 * RLS requires draft status in (`submitted`, `open_for_bids`) and draft owner ≠ supplier.
 */
export async function createSupplierBidDraft(
  client: RfqSupabase,
  supplierUserId: string,
  draftId: string,
  input: SupplierBidInput = {},
): Promise<{ ok: true; bidId: string } | { ok: false; code: string; detail?: string }> {
  const meta = (input.metadata ?? {}) as Json;
  const { data, error } = await client
    .from("rfq_bids")
    .insert({
      draft_id: draftId,
      supplier_user_id: supplierUserId,
      status: "draft",
      supplier_notes: input.supplier_notes ?? null,
      total_amount: input.total_amount ?? null,
      currency: input.currency ?? "EGP",
      metadata: meta,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, code: "BID_ALREADY_EXISTS", detail: error.message };
    }
    return { ok: false, code: "BID_INSERT_FAILED", detail: error.message };
  }
  if (!data) {
    return { ok: false, code: "BID_INSERT_FAILED" };
  }
  return { ok: true, bidId: data.id };
}

/**
 * Supplier updates their own bid while still in `draft` (stricter rules can move to DB later).
 */
export async function updateSupplierBidDraft(
  client: RfqSupabase,
  supplierUserId: string,
  bidId: string,
  patch: SupplierBidInput,
): Promise<{ ok: true } | { ok: false; code: string; detail?: string }> {
  const row: Database["public"]["Tables"]["rfq_bids"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (patch.supplier_notes !== undefined) row.supplier_notes = patch.supplier_notes;
  if (patch.total_amount !== undefined) row.total_amount = patch.total_amount;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.metadata !== undefined) {
    row.metadata = patch.metadata as Json;
  }

  const { data, error } = await client
    .from("rfq_bids")
    .update(row)
    .eq("id", bidId)
    .eq("supplier_user_id", supplierUserId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, code: "BID_UPDATE_FAILED", detail: error.message };
  }
  if (!data) {
    return { ok: false, code: "BID_NOT_FOUND_OR_NOT_EDITABLE" };
  }
  return { ok: true };
}
