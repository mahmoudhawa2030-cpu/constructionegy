import { createHash, randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  extensionOf,
  isAllowedAttachmentExt,
  normalizeFilename,
  RFQ_SIGNED_URL_TTL,
} from "@/lib/rfq/constants";
import { resolveRfqDraftForUpload } from "@/lib/rfq/draft-service";
import { validateRfqUploadFiles } from "@/lib/rfq/upload-validation";
import type {
  RfqAttachmentDto,
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
      attachments: body.attachments ?? [],
      fileResults: body.fileResults ?? [],
      errors: body.errors ?? [{ code: "UNKNOWN" }],
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

  const files = form
    .getAll("files")
    .filter((v): v is File => typeof File !== "undefined" && v instanceof File);

  const validated = validateRfqUploadFiles(files);
  if (!validated.ok) {
    return err(400, { ok: false, errors: validated.errors });
  }

  const resolved = await resolveRfqDraftForUpload(supabase, user.id, rfqDraftIdRaw || null);
  if (!resolved.ok) {
    const status = resolved.code === "DRAFT_FORBIDDEN" ? 403 : 500;
    return err(status, {
      ok: false,
      errors: [{ code: resolved.code, detail: resolved.detail }],
    });
  }
  const draftId = resolved.draftId;

  const { data: draftRow } = await supabase
    .from("rfq_drafts")
    .select("status")
    .eq("id", draftId)
    .maybeSingle();

  if (!draftRow || draftRow.status !== "draft") {
    return err(403, {
      ok: false,
      rfqDraftId: draftId,
      errors: [{ code: "DRAFT_LOCKED" }],
    });
  }

  // Simplified: no legal company name or metadata update (removed per new requirements).
  // No spreadsheet parsing or rfq_items persistence. All files treated as attachments.

  const attachments: RfqAttachmentDto[] = [];
  const fileResults: RfqUploadFileResult[] = [];
  const errors: { code: string; detail?: string }[] = [];

  for (const file of files) {
    const ext = extensionOf(file.name);

    if (!isAllowedAttachmentExt(ext)) {
      fileResults.push({
        originalName: file.name,
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

    const newId = randomUUID();
    const newPath = `${user.id}/${draftId}/${newId}_${safeBase}`;
    const { error: upErr } = await supabase.storage
      .from("rfq-attachments")
      .upload(newPath, buf, { contentType, upsert: false });

    if (upErr) {
      fileResults.push({
        originalName: file.name,
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
        ok: false,
        errorCode: "ATTACHMENT_INSERT_FAILED",
      });
      errors.push({ code: "ATTACHMENT_INSERT_FAILED", detail: insErr?.message });
      continue;
    }

    const { data: signed } = await supabase.storage
      .from("rfq-attachments")
      .createSignedUrl(inserted.storage_path!, RFQ_SIGNED_URL_TTL);

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
      ok: true,
      attachmentId: inserted.id,
    });
  }

  const allFilesOk = fileResults.length > 0 && fileResults.every((r) => r.ok);
  const status = allFilesOk ? 200 : 422;

  return NextResponse.json(
    {
      ok: allFilesOk,
      rfqDraftId: draftId,
      attachments,
      fileResults,
      errors,
    },
    { status },
  );
}
