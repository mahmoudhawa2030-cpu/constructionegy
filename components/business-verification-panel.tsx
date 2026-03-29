"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { VerifiedBadge } from "@/components/verified-badge";
import type { BusinessVerificationDocType } from "@/lib/business-verification/constants";
import { BUSINESS_VERIFICATION_DOC_TYPES } from "@/lib/business-verification/constants";

type DocRow = {
  document_type: BusinessVerificationDocType;
  original_filename: string | null;
};

type Props = {
  status: string;
  documents: DocRow[];
  adminNotes: string | null;
};

export function BusinessVerificationPanel({ status, documents, adminNotes }: Props) {
  const t = useTranslations("businessVerification");
  const te = useTranslations("businessVerification.errors");
  const router = useRouter();
  const [busyType, setBusyType] = useState<BusinessVerificationDocType | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRefs = useRef<Partial<Record<BusinessVerificationDocType, HTMLInputElement | null>>>({});

  const byType = Object.fromEntries(documents.map((d) => [d.document_type, d])) as Partial<
    Record<BusinessVerificationDocType, DocRow>
  >;

  const canUpload = status === "none" || status === "pending" || status === "rejected";

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
      default:
        return te("UNKNOWN");
    }
  };

  const upload = async (docType: BusinessVerificationDocType, file: File) => {
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

      {canUpload ? (
        <ul className="mt-4 flex flex-col gap-4">
          {BUSINESS_VERIFICATION_DOC_TYPES.map((docType) => (
            <li key={docType} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-950">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t(`doc.${docType}`)}</p>
              {byType[docType]?.original_filename ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {t("currentFile")}: {byType[docType].original_filename}
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("missing")}</p>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[docType] = el;
                }}
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                className="mt-2 block w-full text-xs text-zinc-600 file:me-2 file:rounded-md file:border-0 file:bg-zinc-200 file:px-2 file:py-1 dark:text-zinc-400 dark:file:bg-zinc-800"
                disabled={busyType !== null}
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
                  className="mt-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  disabled={busyType !== null}
                  type="button"
                  onClick={() => inputRefs.current[docType]?.click()}
                >
                  {t("chooseFile")}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">{t("formatsHint")}</p>
    </section>
  );
}
