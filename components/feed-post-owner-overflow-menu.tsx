"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  postId: string;
  /** Position the trigger (e.g. `absolute end-2 top-2 z-20`) */
  className?: string;
};

export function FeedPostOwnerOverflowMenu({ postId, className = "" }: Props) {
  const t = useTranslations("feedPost.owner");
  const menuId = useId();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(ev: PointerEvent) {
      const el = rootRef.current;
      if (!el || !(ev.target instanceof Node) || !el.contains(ev.target)) {
        setOpen(false);
      }
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/feed/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      const code = json.error;
      if (code === "unauthorized") {
        setDeleteError(t("deleteUnauthorized"));
      } else if (code === "forbidden") {
        setDeleteError(t("forbidden"));
      } else if (code === "not_found") {
        setDeleteError(t("notFound"));
      } else {
        setDeleteError(t("deleteFailed"));
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`.trim()}>
      <button
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label={t("overflowMenuAria")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--bina-text)] outline-none transition-colors hover:bg-[var(--bina-steel4)] focus-visible:ring-2 focus-visible:ring-[var(--bina-or)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bina-steel2)] disabled:opacity-50"
        disabled={deleting}
        onClick={() => {
          setDeleteError(null);
          setOpen((v) => !v);
        }}
        type="button"
      >
        <span aria-hidden className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-1 w-1 rounded-full bg-current" />
          <span className="h-1 w-1 rounded-full bg-current" />
        </span>
      </button>

      {open ? (
        <div
          className="absolute end-0 top-full z-50 mt-1 min-w-[11.5rem] overflow-hidden rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel3)] py-1 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          id={menuId}
          role="menu"
        >
          <Link
            className="block px-3 py-2.5 font-bina-display text-[13px] font-semibold text-[var(--bina-text)] no-underline outline-none hover:bg-[var(--bina-steel4)] focus-visible:bg-[var(--bina-steel4)]"
            href={`/posts/${postId}/edit`}
            onClick={close}
            prefetch={false}
            role="menuitem"
          >
            {t("editLink")}
          </Link>
          <div className="mx-2 h-px bg-[var(--bina-border)]" role="separator" />
          <button
            className="w-full px-3 py-2.5 text-start font-bina-display text-[13px] font-semibold text-red-300 outline-none hover:bg-red-500/10 focus-visible:bg-red-500/10 disabled:opacity-60"
            disabled={deleting}
            onClick={() => void onDelete()}
            role="menuitem"
            type="button"
          >
            {deleting ? t("deleteDeleting") : t("deleteButton")}
          </button>
        </div>
      ) : null}

      {deleteError ? (
        <p
          className="absolute end-0 top-full z-40 mt-1 max-w-[14rem] rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-end font-bina-display text-[11px] text-red-200 shadow-lg"
          role="alert"
        >
          {deleteError}
        </p>
      ) : null}
    </div>
  );
}
