import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import {
  type BusinessVerificationDocType,
  BUSINESS_VERIFICATION_MAX_FILE_BYTES,
  BUSINESS_VERIFICATION_DOC_TYPES,
  isAllowedVerificationExt,
} from "@/lib/business-verification/constants";
import { extensionOf, normalizeFilename } from "@/lib/rfq/constants";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isDocType(v: string): v is BusinessVerificationDocType {
  return (BUSINESS_VERIFICATION_DOC_TYPES as readonly string[]).includes(v);
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_verification_status")
    .eq("id", user.id)
    .maybeSingle();

  const st = profile?.business_verification_status ?? "none";
  if (!["none", "pending", "rejected"].includes(st)) {
    return NextResponse.json({ ok: false, code: "NOT_EDITABLE" }, { status: 403 });
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
  const contentType = file.type || "application/octet-stream";
  const newPath = `${user.id}/${randomUUID()}_${safeBase}`;

  const { data: existing } = await supabase
    .from("business_verification_documents")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .eq("document_type", docTypeRaw)
    .maybeSingle();

  if (existing?.storage_path) {
    await supabase.storage.from("business-verification").remove([existing.storage_path]);
  }

  const { error: upErr } = await supabase.storage
    .from("business-verification")
    .upload(newPath, buf, { contentType, upsert: false });

  if (upErr) {
    return NextResponse.json({ ok: false, code: "STORAGE_FAILED", detail: upErr.message }, { status: 500 });
  }

  const { error: dbErr } = await supabase.from("business_verification_documents").upsert(
    {
      user_id: user.id,
      document_type: docTypeRaw,
      storage_path: newPath,
      original_filename: safeBase,
      content_type: contentType,
      byte_size: buf.length,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,document_type" },
  );

  if (dbErr) {
    await supabase.storage.from("business-verification").remove([newPath]);
    return NextResponse.json({ ok: false, code: "DB_FAILED", detail: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, documentType: docTypeRaw });
}
