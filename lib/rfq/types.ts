export type RfqAttachmentDto = {
  id: string;
  draftId: string;
  originalFilename: string;
  contentType: string | null;
  byteSize: number;
  signedUrl: string | null;
  createdAt: string;
};

/** Simplified RFQ for new creation flow (no line items/spreadsheet). */
export type SimplifiedRfqDraft = {
  id: string;
  userId: string;
  title: string | null;
  description: string | null;
  location: string | null;
  closingDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  attachments?: RfqAttachmentDto[];
  bids?: RfqBidSummary[];
};

export type RfqBidSummary = {
  id: string;
  supplierUserId: string;
  fullName?: string;
  totalAmount: number | null;
  currency: string;
  status: string;
  createdAt: string;
  profileLink?: string; // for UI
};

/** @deprecated Use SimplifiedRfqDraft and description field. Spreadsheet/items removed. */
export type RfqItemPreview = {
  rowIndex: number;
  description: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  fieldErrors?: Record<string, string>;
};

export type RfqUploadFileResult = {
  originalName: string;
  ok: boolean;
  errorCode?: string;
  attachmentId?: string;
};

export type RfqUploadResponse = {
  ok: boolean;
  rfqDraftId: string | null;
  attachments: RfqAttachmentDto[];
  fileResults: RfqUploadFileResult[];
  errors: { code: string; detail?: string }[];
};
