"use client";

import { useCallback, useState } from "react";

type Props = {
  url: string;
  title: string;
};

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
      />
    </svg>
  );
}

export function ListingShareButton({ url, title }: Props) {
  const [busy, setBusy] = useState(false);

  const share = useCallback(async () => {
    const targetUrl =
      url.length > 0 ? url : typeof window !== "undefined" ? window.location.href : "";
    if (!targetUrl) {
      alert("تعذر تحديد الرابط.");
      return;
    }
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url: targetUrl });
        return;
      }
      await navigator.clipboard.writeText(targetUrl);
      alert("تم نسخ الرابط.");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(targetUrl);
        alert("تم نسخ الرابط.");
      } catch {
        alert("تعذر المشاركة. انسخ الرابط يدوياً من شريط العنوان.");
      }
    } finally {
      setBusy(false);
    }
  }, [title, url]);

  return (
    <button
      aria-label="مشاركة الإعلان"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1 text-zinc-700 transition-opacity hover:opacity-80 disabled:opacity-50 sm:hidden dark:text-zinc-200"
      disabled={busy}
      title="مشاركة"
      type="button"
      onClick={() => void share()}
    >
      <ShareIcon className="h-7 w-7" />
      <span className="text-sm font-medium">مشاركة</span>
    </button>
  );
}
