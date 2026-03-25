"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteListing, pauseListing, resumeListing } from "@/lib/listings/actions";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type Props = {
  listing: ListingRow;
};

export function UserAdsListingActions({ listing }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const canPause = listing.status === "active";
  const isPaused = listing.status === "paused";

  function run(result: Promise<{ ok: true; id: string } | { ok: false; message: string }>) {
    startTransition(async () => {
      const r = await result;
      if (!r.ok) {
        alert(r.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      {canPause ? (
        <button
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
          disabled={pending}
          type="button"
          onClick={() => run(pauseListing(listing.id))}
        >
          إيقاف مؤقت
        </button>
      ) : null}
      {isPaused ? (
        <button
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          disabled={pending}
          type="button"
          onClick={() => run(resumeListing(listing.id))}
        >
          إعادة النشر
        </button>
      ) : null}
      <button
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        disabled={pending}
        type="button"
        onClick={() => {
          if (!confirm("حذف هذا الإعلان نهائياً؟ لا يمكن التراجع.")) {
            return;
          }
          run(deleteListing(listing.id));
        }}
      >
        حذف الإعلان
      </button>
      {pending ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">جارٍ التنفيذ…</span>
      ) : null}
    </div>
  );
}
