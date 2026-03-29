/**
 * RFQ lifecycle + bid statuses. Keep in sync with Postgres CHECK constraints
 * (see supabase/migrations/*rfq*).
 */
export const RFQ_DRAFT_STATUSES = [
  "draft",
  "submitted",
  "archived",
  "open_for_bids",
  "closed",
  "awarded",
] as const;

export type RfqDraftStatus = (typeof RFQ_DRAFT_STATUSES)[number];

export const RFQ_BID_STATUSES = ["draft", "submitted", "withdrawn", "accepted", "rejected"] as const;

export type RfqBidStatus = (typeof RFQ_BID_STATUSES)[number];

/** Draft statuses that allow suppliers to create bids (RLS matches this set). */
export const RFQ_STATUSES_OPEN_FOR_BIDDING = ["submitted", "open_for_bids"] as const satisfies readonly RfqDraftStatus[];

/** Key in `rfq_drafts.metadata` (JSON) for buyer legal / registered company name. */
export const RFQ_METADATA_LEGAL_COMPANY_NAME = "legal_company_name" as const;

export function getLegalCompanyNameFromDraftMetadata(metadata: unknown): string {
  if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }
  const raw = (metadata as Record<string, unknown>)[RFQ_METADATA_LEGAL_COMPANY_NAME];
  return typeof raw === "string" ? raw.trim() : "";
}

export const RFQ_LEGAL_COMPANY_NAME_MIN = 2;
export const RFQ_LEGAL_COMPANY_NAME_MAX = 300;
