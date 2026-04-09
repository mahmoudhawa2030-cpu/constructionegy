"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  postId: string;
};

export function FeedPostOwnerActions({ postId }: Props) {
  const t = useTranslations("feedPost.owner");
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm(t("deleteConfirm"))) {
      return;
    }
    setDeleteError(null);
    setDeleting(true);
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
    <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-[var(--bina-border)] pb-4">
      <Link
        className="font-bina-display rounded-[var(--bina-r)] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--bina-text)] underline-offset-2 hover:underline"
        href={`/posts/${postId}/edit`}
      >
        {t("editLink")}
      </Link>
      <button
        className="font-bina-display rounded-[var(--bina-r)] border border-red-500/50 bg-red-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-red-200 hover:bg-red-500/25 disabled:opacity-60"
        disabled={deleting}
        onClick={() => void onDelete()}
        type="button"
      >
        {deleting ? t("deleteDeleting") : t("deleteButton")}
      </button>
      {deleteError ? (
        <p className="w-full font-bina-display text-xs text-red-300" role="alert">
          {deleteError}
        </p>
      ) : null}
    </div>
  );
}
