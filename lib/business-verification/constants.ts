/** Stored in `business_verification_documents.document_type` and upload form field. */
export const BUSINESS_VERIFICATION_DOC_TYPES = ["commercial_register", "tax_card", "personal_id"] as const;

export type BusinessVerificationDocType = (typeof BUSINESS_VERIFICATION_DOC_TYPES)[number];

export const BUSINESS_VERIFICATION_MAX_FILE_BYTES = 15 * 1024 * 1024;

const ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

export function isAllowedVerificationExt(ext: string): boolean {
  return ALLOWED_EXT.has(ext.toLowerCase());
}
