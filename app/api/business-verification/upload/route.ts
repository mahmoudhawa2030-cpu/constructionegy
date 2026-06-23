import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  type BusinessVerificationDocType,
  BUSINESS_VERIFICATION_MAX_FILE_BYTES,
  BUSINESS_VERIFICATION_DOC_TYPES,
  isAllowedVerificationExt,
} from "@/lib/business-verification/constants";
import { extensionOf, normalizeFilename } from "@/lib/rfq/constants";
import { RFQ_LEGAL_COMPANY_NAME_MAX, RFQ_LEGAL_COMPANY_NAME_MIN } from "@/lib/rfq/domain";
import { fetchProfileLegalCompanyName } from "@/lib/profiles/legal-company-name";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isDocType(v: string): v is BusinessVerificationDocType {
  return (BUSINESS_VERIFICATION_DOC_TYPES as readonly string[]).includes(v);
}

/** Derive a bucket-safe MIME type from the file extension when the browser omits file.type. */
function mimeFromExt(ext: string, fallback: string): string {
  switch (ext.toLowerCase()) {
    case "pdf":  return "application/pdf";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png":  return "image/png";
    case "webp": return "image/webp";
    default:     return fallback || "application/octet-stream";
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
    }

    const legalRow = await fetchProfileLegalCompanyName(supabase, user.id);
    const legal = (legalRow ?? "").trim();
    if (legal.length < RFQ_LEGAL_COMPANY_NAME_MIN || legal.length > RFQ_LEGAL_COMPANY_NAME_MAX) {
      return NextResponse.json({ ok: false, code: "LEGAL_NAME_REQUIRED" }, { status: 400 });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ ok: false, code: "INVALID_FORM" }, { status: 400 });
    }

    const docTypeRaw = String(form.get("document_type") ?? "").trim();
    if (!isDocType(docTypeRaw)) {
      return NextResponse.json({ ok: false, code: "INVALID_DOCUMENT_TYPE" }, { status: 400 });
    }

    const file = form.get("file");
    if (typeof File === "undefined" || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: false, code: "NO_FILE" }, { status: 400 });
    }

    if (file.size > BUSINESS_VERIFICATION_MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, code: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const ext = extensionOf(file.name);
    if (!isAllowedVerificationExt(ext)) {
      return NextResponse.json({ ok: false, code: "UNSUPPORTED_TYPE" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const safeBase = normalizeFilename(file.name);
    const contentType = mimeFromExt(ext, file.type);
    const newPath = `${user.id}/${randomUUID()}_${safeBase}`;

    const { error: upErr } = await supabase.storage
      .from("business-verification")
      .upload(newPath, buf, { contentType, upsert: false });

    if (upErr) {
      console.error("[biz-verify/upload] storage error:", upErr.message);
      return NextResponse.json({ ok: false, code: "STORAGE_FAILED", detail: upErr.message }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { error: dbErr } = await (supabase as any)
      .from("business_verification_documents")
      .upsert(
        {
          user_id: user.id,
          document_type: docTypeRaw,
          storage_path: newPath,
          original_filename: safeBase,
          content_type: contentType,
          byte_size: buf.length,
          updated_at: now,
        },
        { onConflict: "user_id,document_type" },
      );

    if (dbErr) {
      console.error("[biz-verify/upload] db error:", dbErr.message);
      await supabase.storage.from("business-verification").remove([newPath]);
      return NextResponse.json({ ok: false, code: "DB_FAILED", detail: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, documentType: docTypeRaw });
  } catch (err) {
    console.error("[biz-verify/upload] unexpected error:", err);
    return NextResponse.json({ ok: false, code: "UNKNOWN" }, { status: 500 });
  }
}
