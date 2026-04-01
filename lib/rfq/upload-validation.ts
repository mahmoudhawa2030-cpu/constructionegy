import {
  RFQ_BID_UPLOAD_MAX_FILE_BYTES,
  RFQ_BID_UPLOAD_MAX_FILES,
  RFQ_BID_UPLOAD_MAX_TOTAL_BYTES,
  RFQ_UPLOAD_MAX_FILE_BYTES,
  RFQ_UPLOAD_MAX_FILES,
  RFQ_UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/rfq/constants";

export type RfqUploadValidationError = { code: string; detail?: string };

/**
 * Validates file count/size before storage or parsing. Pure helper for API routes and future jobs.
 */
export function validateRfqUploadFiles(files: File[]): { ok: true } | { ok: false; errors: RfqUploadValidationError[] } {
  const errors: RfqUploadValidationError[] = [];

  if (files.length === 0) {
    errors.push({ code: "NO_FILES" });
  }
  if (files.length > RFQ_UPLOAD_MAX_FILES) {
    errors.push({ code: "TOO_MANY_FILES" });
  }

  let total = 0;
  for (const f of files) {
    total += f.size;
    if (f.size > RFQ_UPLOAD_MAX_FILE_BYTES) {
      errors.push({ code: "FILE_TOO_LARGE", detail: f.name });
    }
  }
  if (total > RFQ_UPLOAD_MAX_TOTAL_BYTES) {
    errors.push({ code: "TOTAL_TOO_LARGE" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}

/**
 * Validates bid reply file count/size (documents / PDFs / etc.).
 */
export function validateRfqBidUploadFiles(
  files: File[],
): { ok: true } | { ok: false; errors: RfqUploadValidationError[] } {
  const errors: RfqUploadValidationError[] = [];

  if (files.length > RFQ_BID_UPLOAD_MAX_FILES) {
    errors.push({ code: "TOO_MANY_FILES" });
  }

  let total = 0;
  for (const f of files) {
    total += f.size;
    if (f.size > RFQ_BID_UPLOAD_MAX_FILE_BYTES) {
      errors.push({ code: "FILE_TOO_LARGE", detail: f.name });
    }
  }
  if (total > RFQ_BID_UPLOAD_MAX_TOTAL_BYTES) {
    errors.push({ code: "TOTAL_TOO_LARGE" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true };
}
