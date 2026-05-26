"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import type { ProfileLegalNameActionState } from "@/app/(mobile)/profile/actions";
import { saveProfileLegalCompanyNameAction } from "@/app/(mobile)/profile/actions";
import { VerifiedBadge } from "@/components/verified-badge";
import type { BusinessVerificationDocType } from "@/lib/business-verification/constants";
import { BUSINESS_VERIFICATION_DOC_TYPES } from "@/lib/business-verification/constants";
import { RFQ_LEGAL_COMPANY_NAME_MAX, RFQ_LEGAL_COMPANY_NAME_MIN } from "@/lib/rfq/domain";

type DocRow = {
  id: string;
  document_type: BusinessVerificationDocType;
  original_filename: string | null;
  previewUrl: string | null;
  createdAt: string;
};

type Props = {
  status: string;
  documents: DocRow[];
  adminNotes: string | null;
  legalCompanyName: string | null;
};

export function BusinessVerificationPanel({ status, documents, adminNotes, legalCompanyName }: Props) {
  const t = useTranslations("businessVerification");
  const ta = useTranslations("businessVerification.actions");
  const te = useTranslations("businessVerification.errors");
  const router = useRouter();
  const legalLabelId = useId();
  const legalInputId = useId();
  const [busyType, setBusyType] = useState<BusinessVerificationDocType | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [legalInput, setLegalInput] = useState((legalCompanyName ?? "").trim());
  const [legalSaveState, legalSaveAction, legalSavePending] = useActionState(
    saveProfileLegalCompanyNameAction,
    null as ProfileLegalNameActionState | null,
  );
  const inputRefs = useRef<Partial<Record<BusinessVerificationDocType, HTMLInputElement | null>>>({});

  useEffect(() => {
    setLegalInput((legalCompanyName ?? "").trim());
  }, [legalCompanyName]);

  const byType = Object.fromEntries(
    BUSINESS_VERIFICATION_DOC_TYPES.map((dt) => [
      dt,
      documents.filter((d) => d.document_type === dt),
    ]),
  ) as Record<BusinessVerificationDocType, DocRow[]>;

  const savedLegalTrimmed = (legalCompanyName ?? "").trim();
  const uploadsAllowed =
    savedLegalTrimmed.length >= RFQ_LEGAL_COMPANY_NAME_MIN &&
    savedLegalTrimmed.length <= RFQ_LEGAL_COMPANY_NAME_MAX;

  const errMsg = (code: string) => {
    switch (code) {
      case "UNAUTHORIZED":
        return te("UNAUTHORIZED");
      case "NOT_EDITABLE":
        return te("NOT_EDITABLE");
      case "INVALID_FORM":
        return te("INVALID_FORM");
      case "INVALID_DOCUMENT_TYPE":
        return te("INVALID_DOCUMENT_TYPE");
      case "NO_FILE":
        return te("NO_FILE");
      case "FILE_TOO_LARGE":
        return te("FILE_TOO_LARGE");
      case "UNSUPPORTED_TYPE":
        return te("UNSUPPORTED_TYPE");
      case "STORAGE_FAILED":
        return te("STORAGE_FAILED");
      case "DB_FAILED":
        return te("DB_FAILED");
      case "LEGAL_NAME_REQUIRED":
        return te("LEGAL_NAME_REQUIRED");
      default:
        return te("UNKNOWN");
    }
  };

  const upload = async (docType: BusinessVerificationDocType, file: File) => {
    if (!uploadsAllowed) {
      setMessage({ ok: false, text: te("LEGAL_NAME_REQUIRED") });
      return;
    }
    setBusyType(docType);
    setMessage(null);
    const fd = new FormData();
    fd.set("document_type", docType);
    fd.set("file", file);
    try {
      const res = await fetch("/api/business-verification/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; code?: string };
      if (!res.ok || !data.ok) {
        setMessage({ ok: false, text: errMsg(data.code ?? "UNKNOWN") });
        setBusyType(null);
        return;
      }
      setMessage({ ok: true, text: t("uploadSuccess") });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: errMsg("UNKNOWN") });
    }
    setBusyType(null);
  };

  return (
    <section
      className="scroll-mt-24 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
      id="business-verification"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("heading")}</h2>
        {status === "verified" ? <VerifiedBadge className="ms-1" label={t("badgeAria")} /> : null}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>

      {status === "verified" ? (
        <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">{t("statusVerified")}</p>
      ) : null}
      {status === "pending" ? (
        <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">{t("statusPending")}</p>
      ) : null}
      {status === "rejected" && adminNotes ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {t("rejectionPrefix")} {adminNotes}
        </p>
      ) : status === "rejected" ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("statusRejected")}</p>
      ) : null}
      {status === "none" ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("statusNone")}</p> : null}

      {message ? (
        <p
          className={`mt-2 text-sm ${message.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {/* ── Company name — always editable ── */}
      <form
        action={legalSaveAction}
        className="mt-4 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-950"
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50" id={legalLabelId}>
          {t("legalCompanyNameLabel")}
          <span className="ms-1 text-red-600 dark:text-red-400" aria-hidden>*</span>
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("legalCompanyNameHint")}</p>
        <input
          aria-labelledby={legalLabelId}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          id={legalInputId}
          maxLength={RFQ_LEGAL_COMPANY_NAME_MAX}
          name="legal_company_name"
          onChange={(e) => setLegalInput(e.target.value)}
          type="text"
          value={legalInput}
        />
        <button
          className="self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          disabled={legalSavePending}
          type="submit"
        >
          {legalSavePending ? ta("savingLegalCompany") : ta("saveLegalCompany")}
        </button>
        {legalSaveState ? (
          <p
            className={legalSaveState.ok ? "text-sm text-emerald-700 dark:text-emerald-300" : "text-sm text-red-600 dark:text-red-400"}
            role="status"
          >
            {legalSaveState.message}
          </p>
        ) : null}
      </form>

      {!uploadsAllowed ? (
        <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">{t("uploadsLockedUntilLegalName")}</p>
      ) : null}

      {/* ── Documents — always upload new, old shown as read-only history ── */}
      <ul
        className={`mt-4 flex flex-col gap-4 ${!uploadsAllowed ? "pointer-events-none opacity-50" : ""}`}
        aria-disabled={!uploadsAllowed}
      >
        {BUSINESS_VERIFICATION_DOC_TYPES.map((docType) => {
          const docs = byType[docType];
          const latest = docs[0] ?? null;
          return (
            <li
              key={docType}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-950"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t(`doc.${docType}`)}</p>

              {/* Latest upload preview */}
              {latest ? (
                <div className="mt-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("currentFile")}: <span className="font-medium">{latest.original_filename}</span>
                  </p>
                  {latest.previewUrl ? (
                    <a
                      className="mt-2 inline-block overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-600"
                      href={latest.previewUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Image
                        alt={t("previewImageAlt")}
                        className="max-h-48 w-auto max-w-full object-contain"
                        height={192}
                        src={latest.previewUrl}
                        unoptimized
                        width={320}
                      />
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("missing")}</p>
              )}

              {/* Upload new */}
              <input
                ref={(el) => { inputRefs.current[docType] = el; }}
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="mt-2 block w-full text-xs text-zinc-600 file:me-2 file:rounded-md file:border-0 file:bg-zinc-200 file:px-2 file:py-1 dark:text-zinc-400 dark:file:bg-zinc-800"
                disabled={busyType !== null || !uploadsAllowed}
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void upload(docType, f);
                }}
              />
              {busyType === docType ? (
                <p className="mt-1 text-xs text-zinc-500">{t("uploading")}</p>
              ) : (
                <button
                  className="mt-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  disabled={busyType !== null || !uploadsAllowed}
                  type="button"
                  onClick={() => inputRefs.current[docType]?.click()}
                >
                  {latest ? t("replaceFile") : t("chooseFile")}
                </button>
              )}

              {/* Previous uploads — read-only history */}
              {docs.length > 1 ? (
                <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-700">
                  <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("previousUploads")}</p>
                  <ul className="flex flex-col gap-1.5">
                    {docs.slice(1).map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900">
                        <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400" title={doc.original_filename ?? ""}>
                          {doc.original_filename ?? "—"}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                        {doc.previewUrl ? (
                          <a
                            href={doc.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-[10px] text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
                          >
                            {t("viewFile")}
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">{t("formatsHint")}</p>
    </section>
  );
}
