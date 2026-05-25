"use client";

import { useState, useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { adminUi } from "@/lib/admin-ui";
import { deleteMediaFileAction, type MediaActionState } from "./actions";
import type { MediaFile } from "./page";

const BUCKET_COLORS: Record<string, string> = {
  "listing-images": "bg-green-100 text-green-800",
  "homepage-hero-images": "bg-blue-100 text-blue-800",
  "homepage-desktop-category-icons": "bg-purple-100 text-purple-800",
};

const PAGE_SIZE = 100;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${adminUi.btnGhost} text-[10px]`}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "✓" : "Copy URL"}
    </button>
  );
}

function DeleteButton({ bucket, path }: { bucket: string; path: string }) {
  const t = useTranslations("adminMedia");
  const [state, action, pending] = useActionState(
    deleteMediaFileAction,
    null as MediaActionState | null,
  );
  const [, startTransition] = useTransition();

  if (state?.ok === false) {
    return <span className="text-[10px] text-red-600">{state.message}</span>;
  }

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) e.preventDefault();
      }}
    >
      <input type="hidden" name="bucket" value={bucket} />
      <input type="hidden" name="path" value={path} />
      <button type="submit" disabled={pending} className={`${adminUi.btnDanger} text-[10px]`}>
        {pending ? "…" : t("delete")}
      </button>
    </form>
  );
}

export function MediaGrid({ files }: { files: MediaFile[] }) {
  const t = useTranslations("adminMedia");
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const buckets = Array.from(new Set(files.map((f) => f.bucket)));

  const filtered = files.filter((f) => {
    if (bucket !== "all" && f.bucket !== bucket) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) && !f.path.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("searchPlaceholder")}
          className={`${adminUi.input} w-56`}
        />
        <select
          value={bucket}
          onChange={(e) => { setBucket(e.target.value); setPage(1); }}
          className={adminUi.select}
        >
          <option value="all">{t("allBuckets")}</option>
          {buckets.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <div className="flex rounded-sm border border-[var(--admin-shell-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "grid" ? "bg-[var(--admin-brand)] text-white" : "bg-white text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"}`}
          >
            ▦ {t("viewGrid")}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-[var(--admin-brand)] text-white" : "bg-white text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"}`}
          >
            ☰ {t("viewList")}
          </button>
        </div>
        <span className={adminUi.footnote}>
          {filtered.length} {t("files")} · {t("page")} {safePage}/{totalPages}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("noResults")}</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {paginated.map((f) => (
            <div
              key={`${f.bucket}/${f.path}`}
              className={`${adminUi.card} flex flex-col overflow-hidden`}
            >
              {/* Thumbnail */}
              <div className="relative h-32 w-full bg-[var(--admin-zebra-odd)] flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.publicUrl}
                  alt={f.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                  }}
                />
                <span className="absolute top-1 end-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  {f.ext}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1 p-2">
                <p className="truncate text-[11px] font-semibold text-[var(--admin-text)]" title={f.name}>
                  {f.name}
                </p>
                <span
                  className={`w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${BUCKET_COLORS[f.bucket] ?? "bg-zinc-100 text-zinc-700"}`}
                >
                  {f.bucketLabel}
                </span>
                <p className={`${adminUi.footnote} tabular-nums`}>{f.sizeLabel}</p>
                {f.createdAt ? (
                  <p className={adminUi.footnote}>
                    {new Date(f.createdAt).toLocaleDateString("en-GB")}
                  </p>
                ) : null}
                <p className="truncate font-mono text-[9px] text-[var(--admin-text-secondary)]" title={f.path}>
                  {f.path}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <CopyButton text={f.publicUrl} />
                  <DeleteButton bucket={f.bucket} path={f.path} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className={adminUi.widget}>
          <div className={adminUi.widgetBodyFlush}>
            <div className={adminUi.tableWrap}>
              <table className={`${adminUi.table} min-w-[52rem]`}>
                <thead>
                  <tr className={adminUi.theadRow}>
                    <th className={adminUi.th}>{t("colPreview")}</th>
                    <th className={adminUi.th}>{t("colName")}</th>
                    <th className={adminUi.th}>{t("colBucket")}</th>
                    <th className={adminUi.th}>{t("colExt")}</th>
                    <th className={adminUi.th}>{t("colSize")}</th>
                    <th className={adminUi.th}>{t("colDate")}</th>
                    <th className={adminUi.th}>{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((f) => (
                    <tr key={`${f.bucket}/${f.path}`} className={adminUi.tbodyRow}>
                      <td className={adminUi.td}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={f.publicUrl}
                          alt={f.name}
                          className="h-12 w-12 rounded object-cover border border-[var(--admin-cell-border)]"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1.5'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                          }}
                        />
                      </td>
                      <td className={adminUi.td}>
                        <p className="max-w-[16rem] truncate text-xs font-semibold text-[var(--admin-text)]" title={f.name}>
                          {f.name}
                        </p>
                        <p className="max-w-[16rem] truncate font-mono text-[10px] text-[var(--admin-text-secondary)]" title={f.path}>
                          {f.path}
                        </p>
                      </td>
                      <td className={adminUi.td}>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${BUCKET_COLORS[f.bucket] ?? "bg-zinc-100 text-zinc-700"}`}>
                          {f.bucketLabel}
                        </span>
                      </td>
                      <td className={`${adminUi.td} font-mono text-xs uppercase`}>{f.ext}</td>
                      <td className={`${adminUi.td} tabular-nums text-xs`}>{f.sizeLabel}</td>
                      <td className={`${adminUi.td} text-xs`}>
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td className={adminUi.td}>
                        <div className="flex items-center gap-1.5">
                          <CopyButton text={f.publicUrl} />
                          <a
                            href={f.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${adminUi.btnGhost} text-[10px]`}
                          >
                            {t("open")}
                          </a>
                          <DeleteButton bucket={f.bucket} path={f.path} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={safePage === 1}
            className={`${adminUi.btnSecondary} disabled:opacity-40`}
          >
            «
          </button>
          <button
            type="button"
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
            className={`${adminUi.btnSecondary} disabled:opacity-40`}
          >
            ‹ {t("prev")}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce<Array<number | "…">>((acc, p, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === "number" && (arr[idx - 1] as number) + 1 < p) {
                acc.push("…");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "…" ? (
                <span key={`ellipsis-${idx}`} className={`${adminUi.footnote} px-1`}>…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item as number)}
                  className={`min-w-[2rem] px-2 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
                    safePage === item
                      ? "border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white"
                      : "border-[var(--admin-shell-border)] bg-white text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            type="button"
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
            className={`${adminUi.btnSecondary} disabled:opacity-40`}
          >
            {t("next")} ›
          </button>
          <button
            type="button"
            onClick={() => goToPage(totalPages)}
            disabled={safePage === totalPages}
            className={`${adminUi.btnSecondary} disabled:opacity-40`}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
