export type RfqItemPreview = {
  rowIndex: number;
  description: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  fieldErrors?: Record<string, string>;
};

export type RfqAttachmentDto = {
  id: string;
  draftId: string;
  originalFilename: string;
  contentType: string | null;
  byteSize: number;
  signedUrl: string | null;
  createdAt: string;
};

export type RfqUploadFileResult = {
  originalName: string;
  kind: "spreadsheet" | "attachment";
  ok: boolean;
  errorCode?: string;
  parsedRowCount?: number;
  attachmentId?: string;
};

export type RfqUploadResponse = {
  ok: boolean;
  rfqDraftId: string | null;
  parsedItems: RfqItemPreview[];
  attachments: RfqAttachmentDto[];
  spreadsheetMeta: Array<{
    fileName: string;
    sheetName: string;
    rowCount: number;
    mappingVersion: number;
  }>;
  fileResults: RfqUploadFileResult[];
  errors: { code: string; detail?: string }[];
  warnings: { code: string; detail?: string }[];
};
