import { SPREADSHEET_MAPPING_VERSION } from "./constants";

export type RfqMappedField = "description" | "quantity" | "unit" | "notes";

/** Trim, collapse spaces, NFC, lowercase ASCII; keep Arabic letters as-is aside from trim. */
export function normalizeHeader(raw: string): string {
  const s = raw.trim().replace(/\s+/g, " ");
  return s.toLowerCase();
}

/**
 * Versioned header → field map (Arabic + English aliases).
 * Keys must be normalized with `normalizeHeader` before lookup.
 */
export const HEADER_MAP_V1: Record<string, RfqMappedField> = {
  // English
  description: "description",
  item: "description",
  "item description": "description",
  title: "description",
  name: "description",
  product: "description",
  qty: "quantity",
  quantity: "quantity",
  amount: "quantity",
  unit: "unit",
  uom: "unit",
  notes: "notes",
  remarks: "notes",
  comment: "notes",
  // Arabic (common BOQ / tender phrasing)
  البند: "description",
  الوصف: "description",
  "وصف البند": "description",
  الصنف: "description",
  "اسم الصنف": "description",
  البيان: "description",
  المادة: "description",
  الكمية: "quantity",
  الكميه: "quantity",
  الوحدة: "unit",
  الوحده: "unit",
  ملاحظات: "notes",
  "ملاحظة": "notes",
  تعليق: "notes",
};

export function getSpreadsheetMappingVersion(): number {
  return SPREADSHEET_MAPPING_VERSION;
}
