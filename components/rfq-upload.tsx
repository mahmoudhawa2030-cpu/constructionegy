"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";

import type { RfqAttachmentDto, RfqItemPreview } from "@/lib/rfq/types";

type LocalFile = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  errorCode?: string;
  previewUrl: string | null;
};

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function fileIconLabel(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "pdf") return "PDF";
  if (["xls", "xlsx", "csv"].includes(e)) return "XLS";
  if (["doc", "docx"].includes(e)) return "DOC";
  if (["dwg", "dxf"].includes(e)) return "CAD";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(e)) return "IMG";
  if (["zip", "rar", "7z"].includes(e)) return "ZIP";
  return "FILE";
}

const IMG_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

type Props = {
  initialDraftId?: string | null;
  /** When set, we do not replace the URL after the first upload (already deep-linked). */
  draftIdInUrl?: string | null;
  initialLineItems?: RfqItemPreview[];
  initialAttachments?: RfqAttachmentDto[];
  /** When false, hide file upload (e.g. draft already open for bids). */
  allowUpload?: boolean;
};

export function RfqUpload({
  initialDraftId = null,
  draftIdInUrl = null,
  initialLineItems = [],
  initialAttachments = [],
  allowUpload = true,
}: Props) {
  const router = useRouter();
  const t = useTranslations("rfqUpload");
  const te = useTranslations("rfqUpload.errors");
  const inputId = useId();
  const filesRef = useRef<LocalFile[]>([]);
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [parsedItems, setParsedItems] = useState<RfqItemPreview[]>(initialLineItems);
  const [attachments, setAttachments] = useState<RfqAttachmentDto[]>(initialAttachments);
  const [warnings, setWarnings] = useState<{ code: string; detail?: string }[]>([]);
  const [blockingErrors, setBlockingErrors] = useState<{ code: string; detail?: string }[]>([]);
  const [busy, setBusy] = useState(false);

  filesRef.current = localFiles;

  const errMsg = (code: string | undefined) => {
    const c = code ?? "UNKNOWN";
    switch (c) {
      case "UNAUTHORIZED":
        return te("UNAUTHORIZED");
      case "INVALID_FORM_DATA":
        return te("INVALID_FORM_DATA");
      case "NO_FILES":
        return te("NO_FILES");
      case "TOO_MANY_FILES":
        return te("TOO_MANY_FILES");
      case "FILE_TOO_LARGE":
        return te("FILE_TOO_LARGE");
      case "TOTAL_TOO_LARGE":
        return te("TOTAL_TOO_LARGE");
      case "DRAFT_CREATE_FAILED":
        return te("DRAFT_CREATE_FAILED");
      case "DRAFT_FORBIDDEN":
        return te("DRAFT_FORBIDDEN");
      case "SPREADSHEET_READ_ERROR":
        return te("SPREADSHEET_READ_ERROR");
      case "SPREADSHEET_EMPTY":
        return te("SPREADSHEET_EMPTY");
      case "SPREADSHEET_NO_ROWS":
        return te("SPREADSHEET_NO_ROWS");
      case "SPREADSHEET_MISSING_DESCRIPTION_COLUMN":
        return te("SPREADSHEET_MISSING_DESCRIPTION_COLUMN");
      case "SPREADSHEET_TOO_MANY_ROWS":
        return te("SPREADSHEET_TOO_MANY_ROWS");
      case "UNSUPPORTED_EXTENSION":
        return te("UNSUPPORTED_EXTENSION");
      case "REPLACE_TARGET_NOT_FOUND":
        return te("REPLACE_TARGET_NOT_FOUND");
      case "STORAGE_UPLOAD_FAILED":
        return te("STORAGE_UPLOAD_FAILED");
      case "ATTACHMENT_UPDATE_FAILED":
        return te("ATTACHMENT_UPDATE_FAILED");
      case "ATTACHMENT_INSERT_FAILED":
        return te("ATTACHMENT_INSERT_FAILED");
      case "REPLACE_ATTACHMENT_UNUSED":
        return te("REPLACE_ATTACHMENT_UNUSED");
      case "SPREADSHEET_UNMAPPED_COLUMNS":
        return te("SPREADSHEET_UNMAPPED_COLUMNS");
      case "UNKNOWN":
        return te("UNKNOWN");
      case "NETWORK":
        return te("NETWORK");
      case "SUBSCRIPTION_REQUIRED":
        return te("SUBSCRIPTION_REQUIRED");
      case "DRAFT_LOCKED":
        return te("DRAFT_LOCKED");
      case "ITEMS_PERSIST_FAILED":
        return te("ITEMS_PERSIST_FAILED");
      case "LEGAL_COMPANY_NAME_REQUIRED":
        return te("LEGAL_COMPANY_NAME_REQUIRED");
      case "LEGAL_COMPANY_NAME_TOO_LONG":
        return te("LEGAL_COMPANY_NAME_TOO_LONG");
      case "METADATA_SAVE_FAILED":
        return te("METADATA_SAVE_FAILED");
      default:
        return t("errorsFallback", { code: c });
    }
  };

  const onPick = (list: FileList | null) => {
    if (!list?.length) return;
    const next: LocalFile[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list.item(i);
      if (!file) continue;
      const ext = extOf(file.name);
      const previewUrl = IMG_EXT.has(ext) ? URL.createObjectURL(file) : null;
      next.push({
        id: crypto.randomUUID(),
        file,
        status: "queued",
        previewUrl,
      });
    }
    setLocalFiles((prev) => [...prev, ...next]);
  };

  const removeLocal = (id: string) => {
    setLocalFiles((prev) => {
      const lf = prev.find((x) => x.id === id);
      if (lf?.previewUrl) URL.revokeObjectURL(lf.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const submit = async () => {
    if (localFiles.length === 0 || busy) return;
    setBusy(true);
    setBlockingErrors([]);
    setWarnings([]);
    setLocalFiles((prev) => prev.map((x) => ({ ...x, status: "uploading" as const })));

    const fd = new FormData();
    for (const lf of localFiles) {
      fd.append("files", lf.file);
    }
    if (draftId) fd.append("rfqDraftId", draftId);

    type UploadJson = {
      rfqDraftId?: string | null;
      parsedItems?: RfqItemPreview[];
      attachments?: RfqAttachmentDto[];
      warnings?: { code: string; detail?: string }[];
      errors?: { code: string; detail?: string }[];
      fileResults?: { ok: boolean; kind?: string; errorCode?: string }[];
    };

    let data: UploadJson;
    try {
      const res = await fetch("/api/rfq/upload", { method: "POST", body: fd });
      data = (await res.json()) as UploadJson;
    } catch {
      setLocalFiles((prev) => prev.map((x) => ({ ...x, status: "error" as const, errorCode: "NETWORK" })));
      setBlockingErrors([{ code: "NETWORK" }]);
      setBusy(false);
      return;
    }

    if (data.rfqDraftId) {
      setDraftId(data.rfqDraftId);
      if (!draftIdInUrl && data.rfqDraftId) {
        router.replace(`/rfq?draft=${data.rfqDraftId}`);
      }
    }
    const nextParsed = data.parsedItems ?? [];
    if (nextParsed.length > 0) {
      setParsedItems(nextParsed);
    }
    const nextAtt = data.attachments ?? [];
    if (nextAtt.length > 0) {
      setAttachments((prev) => {
        const map = new Map(prev.map((a) => [a.id, a]));
        for (const a of nextAtt) map.set(a.id, a);
        return [...map.values()];
      });
    }
    setWarnings(data.warnings ?? []);
    setBlockingErrors(data.errors ?? []);

    setLocalFiles((prev) =>
      prev.map((lf, i) => {
        const fr = data.fileResults?.[i];
        if (!fr) return { ...lf, status: "error" as const, errorCode: "UNKNOWN" };
        if (fr.ok) return { ...lf, status: "done" as const };
        return { ...lf, status: "error" as const, errorCode: fr.errorCode };
      }),
    );

    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {allowUpload ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor={inputId}>
            {t("pickFiles")}
          </label>
          <input
            multiple
            className="mt-2 block w-full text-sm text-zinc-600 file:me-4 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 dark:text-zinc-400 dark:file:bg-zinc-700 dark:file:text-zinc-100"
            id={inputId}
            type="file"
            onChange={(e) => {
              onPick(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t("hint")}</p>
          <div className="mt-3">
            <button
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              disabled={busy || localFiles.length === 0}
              type="button"
              onClick={() => void submit()}
            >
              {busy ? t("uploading") : t("upload")}
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          {t("uploadLockedHint")}
        </p>
      )}

      {draftId ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("draftId")}: <span className="font-mono text-zinc-700 dark:text-zinc-300">{draftId}</span>
        </p>
      ) : null}

      {localFiles.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label={t("fileListAria")}>
          {localFiles.map((lf) => {
            const ext = extOf(lf.file.name);
            const icon = fileIconLabel(ext);
            return (
              <li
                key={lf.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              >
                <div
                  aria-label={t("fileTypeIconAria", { type: icon })}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {lf.previewUrl ? (
                    <Image
                      alt=""
                      className="h-full w-full rounded-md object-cover"
                      height={48}
                      src={lf.previewUrl}
                      unoptimized
                      width={48}
                    />
                  ) : (
                    icon
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{lf.file.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(`status.${lf.status}`)}
                    {lf.status === "error" && lf.errorCode ? ` — ${errMsg(lf.errorCode)}` : null}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 disabled:opacity-40 dark:text-red-400"
                  disabled={busy}
                  type="button"
                  onClick={() => removeLocal(lf.id)}
                >
                  {t("remove")}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="list-inside list-disc rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {warnings.map((w, i) => (
            <li key={`${w.code}-${i}`}>
              {errMsg(w.code)}
              {w.detail ? ` (${w.detail})` : null}
            </li>
          ))}
        </ul>
      ) : null}

      {blockingErrors.length > 0 ? (
        <ul className="list-inside list-disc rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {blockingErrors.map((e, i) => (
            <li key={`${e.code}-${i}`}>
              {errMsg(e.code)}
              {e.detail ? ` (${e.detail})` : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rfq-items-heading">
          <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50" id="rfq-items-heading">
            {t("sectionItems")}
          </h2>
          {parsedItems.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("emptyItems")}</p>
          ) : (
            <div className="max-h-64 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[20rem] text-start text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">{t("colRow")}</th>
                    <th className="px-2 py-1.5 font-medium">{t("colDescription")}</th>
                    <th className="px-2 py-1.5 font-medium">{t("colQty")}</th>
                    <th className="px-2 py-1.5 font-medium">{t("colUnit")}</th>
                    <th className="px-2 py-1.5 font-medium">{t("colNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedItems.map((row, idx) => (
                    <tr key={`${row.rowIndex}-${idx}`} className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-2 py-1 tabular-nums text-zinc-600 dark:text-zinc-400">{row.rowIndex}</td>
                      <td className="px-2 py-1 text-zinc-900 dark:text-zinc-100">{row.description}</td>
                      <td className="px-2 py-1 tabular-nums">{row.quantity ?? "—"}</td>
                      <td className="px-2 py-1">{row.unit ?? "—"}</td>
                      <td className="px-2 py-1 text-zinc-600 dark:text-zinc-300">{row.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="rfq-attach-heading">
          <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50" id="rfq-attach-heading">
            {t("sectionAttachments")}
          </h2>
          {attachments.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("emptyAttachments")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {a.signedUrl && IMG_EXT.has(extOf(a.originalFilename).toLowerCase()) ? (
                      <Image
                        alt=""
                        className="h-full w-full rounded-md object-cover"
                        height={56}
                        src={a.signedUrl}
                        unoptimized
                        width={56}
                      />
                    ) : (
                      fileIconLabel(extOf(a.originalFilename))
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.originalFilename}</p>
                    <p className="text-xs text-zinc-500">{a.byteSize} B</p>
                    {a.signedUrl ? (
                      <a
                        className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
                        href={a.signedUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {t("openAttachment")}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
