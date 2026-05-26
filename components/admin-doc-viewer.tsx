"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { adminUi } from "@/lib/admin-ui";

export type AdminDocLink = {
  type: string;
  label: string;
  name: string;
  url: string | null;
  uploadedAt?: string | null;
};

type Props = {
  links: AdminDocLink[];
  noDocs: string;
};

export function AdminDocViewer({ links, noDocs }: Props) {
  const t = useTranslations("adminVerifications.detail");
  const [open, setOpen] = useState<AdminDocLink | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => setOpen(null);
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, []);

  const isImage = (name: string) => /\.(jpe?g|png|webp)$/i.test(name);
  const isPdf = (name: string) => /\.pdf$/i.test(name);

  return (
    <>
      {links.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">{noDocs}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((x, i) => (
            <li key={`${x.type}-${i}`} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-[var(--admin-text)]">{x.label}</span>
              <span className="text-[var(--admin-text-secondary)]">— {x.name}</span>
              {x.uploadedAt ? (
                <span className="text-[11px] tabular-nums text-[var(--admin-text-secondary)]">
                  {new Date(x.uploadedAt).toLocaleDateString()}
                </span>
              ) : null}
              {x.url ? (
                <button
                  className={`${adminUi.btnSecondary} text-xs`}
                  type="button"
                  onClick={() => setOpen(x)}
                >
                  {t("open")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* ── Popup dialog ── */}
      <dialog
        ref={dialogRef}
        className="m-auto max-h-[90vh] w-[90vw] max-w-3xl rounded-xl border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-0 shadow-2xl backdrop:bg-black/60"
        onClick={(e) => { if (e.target === dialogRef.current) setOpen(null); }}
      >
        {open ? (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[var(--admin-shell-border)] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{open.label}</p>
                <p className="truncate text-xs text-[var(--admin-text-secondary)]">{open.name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  className={`${adminUi.btnSecondary} text-xs`}
                  href={open.url!}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("openInTab")}
                </a>
                <button
                  aria-label={t("closeViewer")}
                  className={`${adminUi.btnSecondary} text-xs`}
                  type="button"
                  onClick={() => setOpen(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-2">
              {isImage(open.name) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={open.name}
                  className="mx-auto max-h-[75vh] max-w-full rounded object-contain"
                  src={open.url!}
                />
              ) : isPdf(open.name) ? (
                <iframe
                  className="h-[75vh] w-full rounded border-0"
                  src={open.url!}
                  title={open.name}
                />
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-3 text-sm text-[var(--admin-text-secondary)]">
                  <span>{open.name}</span>
                  <a
                    className={adminUi.btnPrimary}
                    href={open.url!}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {t("openInTab")}
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
