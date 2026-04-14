/** Limits for multipart RFQ upload (server-enforced). Simplified to 10MB max per attachment. */
export const RFQ_UPLOAD_MAX_FILES = 5;
export const RFQ_UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB as per requirements
export const RFQ_UPLOAD_MAX_TOTAL_BYTES = 50 * 1024 * 1024;

/** Limits for supplier bid attachment uploads (server-enforced). */
export const RFQ_BID_UPLOAD_MAX_FILES = 5;
export const RFQ_BID_UPLOAD_MAX_FILE_BYTES = RFQ_UPLOAD_MAX_FILE_BYTES;
export const RFQ_BID_UPLOAD_MAX_TOTAL_BYTES = 30 * 1024 * 1024;

/** Signed URL lifetime for private attachment previews (seconds). */
export const RFQ_SIGNED_URL_TTL = 3600;

const ALLOWED_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "dwg",
  "dxf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "txt",
  "zip",
  "rar",
  "7z",
  "csv",
]);

export function normalizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^\w.\-\s\u0600-\u06FF()[\]%]+/g, "_").slice(0, 180).trim() || "file";
}

export function extensionOf(filename: string): string {
  const n = normalizeFilename(filename);
  const i = n.lastIndexOf(".");
  if (i <= 0 || i === n.length - 1) return "";
  return n.slice(i + 1).toLowerCase();
}

export function isAllowedAttachmentExt(ext: string): boolean {
  return ALLOWED_EXT.has(ext.toLowerCase());
}

/** @deprecated Spreadsheet parsing and rfq_items removed in simplification. Use description field instead. */
export const RFQ_SPREADSHEET_MAX_ROWS = 2000;
