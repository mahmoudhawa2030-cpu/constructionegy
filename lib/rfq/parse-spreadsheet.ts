import * as XLSX from "xlsx";

import { RFQ_SPREADSHEET_MAX_ROWS } from "./constants";
import { getSpreadsheetMappingVersion, HEADER_MAP_V1, normalizeHeader, type RfqMappedField } from "./spreadsheet-mapping";
import type { RfqItemPreview } from "./types";

export type ParseSpreadsheetMeta = {
  sheetName: string;
  rowCount: number;
  mappingVersion: number;
};

export type ParseSpreadsheetWarning = { code: string; detail?: string };

export function parseRfqSpreadsheet(buffer: Buffer, fileName: string): {
  items: RfqItemPreview[];
  meta: ParseSpreadsheetMeta | null;
  warnings: ParseSpreadsheetWarning[];
  errorCode?: string;
} {
  const warnings: ParseSpreadsheetWarning[] = [];
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, cellNF: false, cellText: false });
  } catch {
    return { items: [], meta: null, warnings, errorCode: "SPREADSHEET_READ_ERROR" };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName || !workbook.Sheets[sheetName]) {
    return { items: [], meta: null, warnings, errorCode: "SPREADSHEET_EMPTY" };
  }

  const sheet = workbook.Sheets[sheetName];
  const rowsRaw = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!rowsRaw.length) {
    return { items: [], meta: null, warnings, errorCode: "SPREADSHEET_NO_ROWS" };
  }

  const headerCells = rowsRaw[0].map((c) => normalizeHeader(String(c ?? "")));
  const colMap: Partial<Record<RfqMappedField, number>> = {};
  for (let i = 0; i < headerCells.length; i++) {
    const h = headerCells[i];
    if (!h) continue;
    const field = HEADER_MAP_V1[h];
    if (field && colMap[field] === undefined) {
      colMap[field] = i;
    }
  }

  if (colMap.description === undefined) {
    return {
      items: [],
      meta: { sheetName, rowCount: 0, mappingVersion: getSpreadsheetMappingVersion() },
      warnings,
      errorCode: "SPREADSHEET_MISSING_DESCRIPTION_COLUMN",
    };
  }

  const dataRows = rowsRaw.slice(1);
  if (dataRows.length > RFQ_SPREADSHEET_MAX_ROWS) {
    return {
      items: [],
      meta: { sheetName, rowCount: dataRows.length, mappingVersion: getSpreadsheetMappingVersion() },
      warnings,
      errorCode: "SPREADSHEET_TOO_MANY_ROWS",
    };
  }

  const items: RfqItemPreview[] = [];
  const descCol = colMap.description;
  const qtyCol = colMap.quantity;
  const unitCol = colMap.unit;
  const notesCol = colMap.notes;

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    const descRaw = descCol !== undefined ? row[descCol] : "";
    const description = String(descRaw ?? "").trim();
    const emptyRow =
      !description &&
      (qtyCol === undefined || row[qtyCol] === "" || row[qtyCol] === null || row[qtyCol] === undefined) &&
      (unitCol === undefined || String(row[unitCol] ?? "").trim() === "") &&
      (notesCol === undefined || String(row[notesCol] ?? "").trim() === "");
    if (emptyRow) continue;

    const fieldErrors: Record<string, string> = {};
    let quantity: number | null = null;
    if (qtyCol !== undefined && row[qtyCol] !== "" && row[qtyCol] != null) {
      const q = row[qtyCol];
      if (typeof q === "number" && !Number.isNaN(q)) {
        quantity = q;
      } else {
        const n = Number(String(q).replace(/,/g, ".").replace(/\s/g, ""));
        if (!Number.isFinite(n)) {
          fieldErrors.quantity = "invalid_number";
        } else {
          quantity = n;
        }
      }
    }

    const unit =
      unitCol !== undefined && row[unitCol] != null && String(row[unitCol]).trim() !== ""
        ? String(row[unitCol]).trim()
        : null;
    const notes =
      notesCol !== undefined && row[notesCol] != null && String(row[notesCol]).trim() !== ""
        ? String(row[notesCol]).trim()
        : null;

    if (!description) {
      fieldErrors.description = "required";
    }

    items.push({
      rowIndex: r + 2,
      description,
      quantity,
      unit,
      notes,
      ...(Object.keys(fieldErrors).length ? { fieldErrors } : {}),
    });
  }

  if (headerCells.some((h, i) => h && !HEADER_MAP_V1[h] && rowHasData(dataRows, i))) {
    warnings.push({ code: "SPREADSHEET_UNMAPPED_COLUMNS" });
  }

  return {
    items,
    meta: {
      sheetName,
      rowCount: items.length,
      mappingVersion: getSpreadsheetMappingVersion(),
    },
    warnings,
  };
}

function rowHasData(dataRows: unknown[][], colIndex: number): boolean {
  for (const row of dataRows) {
    const v = row[colIndex];
    if (v !== "" && v != null && String(v).trim() !== "") return true;
  }
  return false;
}
