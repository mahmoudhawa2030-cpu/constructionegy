import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type RfqSupabase = SupabaseClient<Database>;

type DraftRow = Pick<
  Database["public"]["Tables"]["rfq_drafts"]["Row"],
  "id" | "user_id" | "status" | "title" | "description" | "location" | "closing_date" | "metadata"
>;

/**
 * Create a new empty RFQ draft for the given profile id.
 */
export async function createRfqDraft(
  client: RfqSupabase,
  userId: string,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const { data, error } = await client.from("rfq_drafts").insert({ user_id: userId }).select("id").single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "insert failed" };
  }
  return { ok: true, id: data.id };
}

/**
 * Load a draft row if it exists and is owned by userId.
 */
export async function getRfqDraftOwnedBy(
  client: RfqSupabase,
  draftId: string,
  userId: string,
): Promise<{ ok: true; draft: DraftRow } | { ok: false; reason: "not_found" | "forbidden" }> {
  const { data, error } = await client
    .from("rfq_drafts")
    .select("id, user_id, status, title, description, location, closing_date, metadata")
    .eq("id", draftId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "not_found" };
  }
  if (data.user_id !== userId) {
    return { ok: false, reason: "forbidden" };
  }
  return { ok: true, draft: data };
}

export type RfqDraftPatch = {
  title?: string | null;
  description?: string | null;
  location?: string | null;
  closing_date?: string | null; // ISO string or null
  status?: Database["public"]["Tables"]["rfq_drafts"]["Row"]["status"];
  /** Shallow merge is done in SQL via || on existing metadata */
  metadata?: Record<string, unknown>;
};

/**
 * Update buyer-owned draft fields. Callers should restrict by status (e.g. only `draft` for heavy edits).
 */
export async function updateRfqDraftForOwner(
  client: RfqSupabase,
  draftId: string,
  userId: string,
  patch: RfqDraftPatch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const owned = await getRfqDraftOwnedBy(client, draftId, userId);
  if (!owned.ok) {
    return { ok: false, message: "forbidden" };
  }

  const row: Database["public"]["Tables"]["rfq_drafts"]["Update"] = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.closing_date !== undefined) row.closing_date = patch.closing_date;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.metadata !== undefined) {
    const prev =
      owned.draft.metadata && typeof owned.draft.metadata === "object" && !Array.isArray(owned.draft.metadata)
        ? (owned.draft.metadata as Record<string, unknown>)
        : {};
    row.metadata = { ...prev, ...patch.metadata } as Database["public"]["Tables"]["rfq_drafts"]["Update"]["metadata"];
  }

  if (Object.keys(row).length === 0) {
    return { ok: true };
  }

  const { error } = await client.from("rfq_drafts").update(row).eq("id", draftId).eq("user_id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

/**
 * Resolve draft id for an upload: create new or verify ownership of existing.
 */
export async function resolveRfqDraftForUpload(
  client: RfqSupabase,
  userId: string,
  existingDraftId: string | null,
): Promise<{ ok: true; draftId: string } | { ok: false; code: string; detail?: string }> {
  if (!existingDraftId) {
    const created = await createRfqDraft(client, userId);
    if (!created.ok) {
      return { ok: false, code: "DRAFT_CREATE_FAILED", detail: created.message };
    }
    return { ok: true, draftId: created.id };
  }

  const got = await getRfqDraftOwnedBy(client, existingDraftId, userId);
  if (!got.ok) {
    return { ok: false, code: "DRAFT_FORBIDDEN" };
  }
  return { ok: true, draftId: existingDraftId };
}
