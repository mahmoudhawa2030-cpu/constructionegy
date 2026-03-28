import { createHash, randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  extensionOf,
  isAllowedAttachmentExt,
  isSpreadsheetExt,
  normalizeFilename,
  RFQ_SIGNED_URL_TTL,
  RFQ_UPLOAD_MAX_FILE_BYTES,
  RFQ_UPLOAD_MAX_FILES,
  RFQ_UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/rfq/constants";
import { parseRfqSpreadsheet } from "@/lib/rfq/parse-spreadsheet";
import type {
  RfqAttachmentDto,
  RfqItemPreview,
  RfqUploadFileResult,
  RfqUploadResponse,
} from "@/lib/rfq/types";
import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function err(
  status: number,
  body: Partial<RfqUploadResponse> & { ok: false },
): NextResponse<RfqUploadResponse> {
  return NextResponse.json(
    {
      ok: false,
      rfqDraftId: body.rfqDraftId ?? null,
      parsedItems: body.parsedItems ?? [],
      attachments: body.attachments ?? [],
      spreadsheetMeta: body.spreadsheetMeta ?? [],
      fileResults: body.fileResults ?? [],
      errors: body.errors ?? [{ code: "UNKNOWN" }],
      warnings: body.warnings ?? [],
    },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse<RfqUploadResponse>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err(401, {
      ok: false,
      errors: [{ code: "UNAUTHORIZED" }],
    });
  }

  if (!(await canAccessFeature(user.id, "rfq"))) {
    return err(403, {
      ok: false,
      errors: [{ code: "SUBSCRIPTION_REQUIRED" }],
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, { ok: false, errors: [{ code: "INVALID_FORM_DATA" }] });
  }

  const rfqDraftIdRaw = String(form.get("rfqDraftId") ?? "").trim();
  const replaceAttachmentId = String(form.get("replaceAttachmentId") ?? "").trim();

  const files = form
    .getAll("files")
    .filter((v): v is File => typeof File !== "undefined" && v instanceof File);

  if (files.length === 0) {
    return err(400, { ok: false, errors: [{ code: "NO_FILES" }] });
  }
  if (files.length > RFQ_UPLOAD_MAX_FILES) {
    return err(400, { ok: false, errors: [{ code: "TOO_MANY_FILES" }] });
  }

  let total = 0;
  for (const f of files) {
    total += f.size;
    if (f.size > RFQ_UPLOAD_MAX_FILE_BYTES) {
      return err(400, { ok: false, errors: [{ code: "FILE_TOO_LARGE", detail: f.name }] });
    }
  }
  if (total > RFQ_UPLOAD_MAX_TOTAL_BYTES) {
    return err(400, { ok: false, errors: [{ code: "TOTAL_TOO_LARGE" }] });
  }

  let draftId = rfqDraftIdRaw;
  if (!draftId) {
    const { data: created, error: draftErr } = await supabase
      .from("rfq_drafts")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (draftErr || !created) {
      return err(500, {
        ok: false,
        errors: [{ code: "DRAFT_CREATE_FAILED", detail: draftErr?.message }],
      });
    }
    draftId = created.id;
  } else {
    const { data: draft, error: draftReadErr } = await supabase
      .from("rfq_drafts")
      .select("id, user_id")
      .eq("id", draftId)
      .maybeSingle();
    if (draftReadErr || !draft || draft.user_id !== user.id) {
      return err(403, { ok: false, errors: [{ code: "DRAFT_FORBIDDEN" }] });
    }
  }

  const parsedItems: RfqItemPreview[] = [];
  const spreadsheetMeta: RfqUploadResponse["spreadsheetMeta"] = [];
  const attachments: RfqAttachmentDto[] = [];
  const fileResults: RfqUploadFileResult[] = [];
  const errors: { code: string; detail?: string }[] = [];
  const warnings: { code: string; detail?: string }[] = [];

  let pendingReplaceId = replaceAttachmentId || null;

  for (const file of files) {
    const ext = extensionOf(file.name);

    if (isSpreadsheetExt(ext)) {
      const buf = Buffer.from(await file.arrayBuffer());
      const parsed = parseRfqSpreadsheet(buf, file.name);
      if (parsed.errorCode) {
        fileResults.push({
          originalName: file.name,
          kind: "spreadsheet",
          ok: false,
          errorCode: parsed.errorCode,
        });
        errors.push({ code: parsed.errorCode, detail: file.name });
        continue;
      }
      for (const it of parsed.items) {
        parsedItems.push(it);
      }
      if (parsed.meta) {
        spreadsheetMeta.push({
          fileName: file.name,
          sheetName: parsed.meta.sheetName,
          rowCount: parsed.meta.rowCount,
          mappingVersion: parsed.meta.mappingVersion,
        });
      }
      for (const w of parsed.warnings) {
        warnings.push({ code: w.code, detail: w.detail });
      }
      fileResults.push({
        originalName: file.name,
        kind: "spreadsheet",
        ok: true,
        parsedRowCount: parsed.items.length,
      });
      continue;
    }

    if (!isAllowedAttachmentExt(ext)) {
      fileResults.push({
        originalName: file.name,
        kind: "attachment",
        ok: false,
        errorCode: "UNSUPPORTED_EXTENSION",
      });
      errors.push({ code: "UNSUPPORTED_EXTENSION", detail: file.name });
      continue;
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buf).digest("hex");
    const safeBase = normalizeFilename(file.name);
    const contentType = file.type || "application/octet-stream";

    if (pendingReplaceId) {
      const { data: existing, error: exErr } = await supabase
        .from("rfq_attachments")
        .select("id, draft_id, uploaded_by, storage_path")
        .eq("id", pendingReplaceId)
        .eq("draft_id", draftId)
        .maybeSingle();

      if (exErr || !existing || existing.uploaded_by !== user.id) {
        fileResults.push({
          originalName: file.name,
          kind: "attachment",
          ok: false,
          errorCode: "REPLACE_TARGET_NOT_FOUND",
        });
        errors.push({ code: "REPLACE_TARGET_NOT_FOUND" });
        pendingReplaceId = null;
        continue;
      }

      await supabase.storage.from("rfq-attachments").remove([existing.storage_path]);

      const newPath = `${user.id}/${draftId}/${existing.id}_${Date.now()}_${safeBase}`;
      const { error: upErr } = await supabase.storage
        .from("rfq-attachments")
        .upload(newPath, buf, { contentType, upsert: false });

      if (upErr) {
        fileResults.push({
          originalName: file.name,
          kind: "attachment",
          ok: false,
          errorCode: "STORAGE_UPLOAD_FAILED",
        });
        errors.push({ code: "STORAGE_UPLOAD_FAILED", detail: upErr.message });
        pendingReplaceId = null;
        continue;
      }

      const { error: updErr } = await supabase
        .from("rfq_attachments")
        .update({
          storage_path: newPath,
          original_filename: safeBase,
          content_type: contentType,
          byte_size: buf.length,
          content_hash: hash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updErr) {
        fileResults.push({
          originalName: file.name,
          kind: "attachment",
          ok: false,
          errorCode: "ATTACHMENT_UPDATE_FAILED",
        });
        errors.push({ code: "ATTACHMENT_UPDATE_FAILED", detail: updErr.message });
        pendingReplaceId = null;
        continue;
      }

      const { data: signed } = await supabase.storage
        .from("rfq-attachments")
        .createSignedUrl(newPath, RFQ_SIGNED_URL_TTL);

      attachments.push({
        id: existing.id,
        draftId,
        originalFilename: safeBase,
        contentType,
        byteSize: buf.length,
        signedUrl: signed?.signedUrl ?? null,
        createdAt: new Date().toISOString(),
      });
      fileResults.push({
        originalName: file.name,
        kind: "attachment",
        ok: true,
        attachmentId: existing.id,
      });
      pendingReplaceId = null;
      continue;
    }

    const newId = randomUUID();
    const newPath = `${user.id}/${draftId}/${newId}_${safeBase}`;
    const { error: upErr } = await supabase.storage
      .from("rfq-attachments")
      .upload(newPath, buf, { contentType, upsert: false });

    if (upErr) {
      fileResults.push({
        originalName: file.name,
        kind: "attachment",
        ok: false,
        errorCode: "STORAGE_UPLOAD_FAILED",
      });
      errors.push({ code: "STORAGE_UPLOAD_FAILED", detail: upErr.message });
      continue;
    }

    const { data: inserted, error: insErr } = await supabase
      .from("rfq_attachments")
      .insert({
        id: newId,
        draft_id: draftId,
        storage_path: newPath,
        original_filename: safeBase,
        content_type: contentType,
        byte_size: buf.length,
        content_hash: hash,
        uploaded_by: user.id,
      })
      .select("id, draft_id, original_filename, content_type, byte_size, created_at, storage_path")
      .single();

    if (insErr || !inserted) {
      await supabase.storage.from("rfq-attachments").remove([newPath]);
      fileResults.push({
        originalName: file.name,
        kind: "attachment",
        ok: false,
        errorCode: "ATTACHMENT_INSERT_FAILED",
      });
      errors.push({ code: "ATTACHMENT_INSERT_FAILED", detail: insErr?.message });
      continue;
    }

    const { data: signed } = await supabase.storage
      .from("rfq-attachments")
      .createSignedUrl(inserted.storage_path, RFQ_SIGNED_URL_TTL);

    attachments.push({
      id: inserted.id,
      draftId: inserted.draft_id,
      originalFilename: inserted.original_filename,
      contentType: inserted.content_type,
      byteSize: inserted.byte_size,
      signedUrl: signed?.signedUrl ?? null,
      createdAt: inserted.created_at,
    });
    fileResults.push({
      originalName: file.name,
      kind: "attachment",
      ok: true,
      attachmentId: inserted.id,
    });
  }

  if (pendingReplaceId) {
    warnings.push({ code: "REPLACE_ATTACHMENT_UNUSED", detail: pendingReplaceId });
  }

  const anyFileOk = fileResults.some((r) => r.ok);
  const allFilesOk = fileResults.length > 0 && fileResults.every((r) => r.ok);
  const status = anyFileOk ? 200 : 422;

  return NextResponse.json(
    {
      ok: allFilesOk,
      rfqDraftId: draftId,
      parsedItems,
      attachments,
      spreadsheetMeta,
      fileResults,
      errors,
      warnings,
    },
    { status },
  );
}
