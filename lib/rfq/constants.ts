/** Limits for multipart RFQ upload (server-enforced). */
export const RFQ_UPLOAD_MAX_FILES = 20;
export const RFQ_UPLOAD_MAX_FILE_BYTES = 25 * 1024 * 1024;
export const RFQ_UPLOAD_MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const RFQ_SPREADSHEET_MAX_ROWS = 2000;

export const SPREADSHEET_MAPPING_VERSION = 1;

/** Signed URL lifetime for private attachment previews (seconds). */
export const RFQ_SIGNED_URL_TTL = 3600;

const SPREADSHEET_EXT = new Set(["xls", "xlsx"]);

const ATTACHMENT_EXT = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
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

export function isSpreadsheetExt(ext: string): boolean {
  return SPREADSHEET_EXT.has(ext.toLowerCase());
}

export function isAllowedAttachmentExt(ext: string): boolean {
  const e = ext.toLowerCase();
  if (SPREADSHEET_EXT.has(e)) return true;
  return ATTACHMENT_EXT.has(e);
}
