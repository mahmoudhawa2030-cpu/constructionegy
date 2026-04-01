import { createHash, randomUUID } from "crypto";

import { extensionOf, isAllowedAttachmentExt, normalizeFilename } from "@/lib/rfq/constants";
import { validateRfqBidUploadFiles } from "@/lib/rfq/upload-validation";

import type { RfqSupabase } from "./draft-service";

export type PersistBidFilesResult =
  | { ok: true; uploadedCount: number }
  | { ok: false; code: string; detail?: string };

/**
 * Stores bid files under `{supplierUserId}/bids/{bidId}/…` in `rfq-attachments` and inserts `rfq_bid_attachments` rows.
 * Caller must ensure the bid exists and belongs to the supplier (RLS also enforces).
 */
export async function persistBidAttachmentFiles(
  client: RfqSupabase,
  supplierUserId: string,
  bidId: string,
  files: File[],
): Promise<PersistBidFilesResult> {
  if (files.length === 0) {
    return { ok: true, uploadedCount: 0 };
  }

  const validated = validateRfqBidUploadFiles(files);
  if (!validated.ok) {
    const first = validated.errors[0];
    return { ok: false, code: first?.code ?? "VALIDATION", detail: first?.detail };
  }

  let uploadedCount = 0;
  for (const file of files) {
    const ext = extensionOf(file.name);
    if (!isAllowedAttachmentExt(ext)) {
      return { ok: false, code: "UNSUPPORTED_EXTENSION", detail: file.name };
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buf).digest("hex");
    const safeBase = normalizeFilename(file.name);
    const contentType = file.type || "application/octet-stream";
    const newId = randomUUID();
    const newPath = `${supplierUserId}/bids/${bidId}/${newId}_${safeBase}`;

    const { error: upErr } = await client.storage.from("rfq-attachments").upload(newPath, buf, {
      contentType,
      upsert: false,
    });

    if (upErr) {
      return { ok: false, code: "STORAGE_UPLOAD_FAILED", detail: upErr.message };
    }

    const { error: insErr } = await client.from("rfq_bid_attachments").insert({
      id: newId,
      bid_id: bidId,
      storage_path: newPath,
      original_filename: safeBase,
      content_type: contentType,
      byte_size: buf.length,
      content_hash: hash,
      uploaded_by: supplierUserId,
    });

    if (insErr) {
      await client.storage.from("rfq-attachments").remove([newPath]);
      return { ok: false, code: "ATTACHMENT_INSERT_FAILED", detail: insErr.message };
    }

    uploadedCount += 1;
  }

  return { ok: true, uploadedCount };
}
