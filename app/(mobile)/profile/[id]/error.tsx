"use client";

import { useEffect } from "react";

export default function ProfilePageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[profile/[id]] error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
        تعذّر تحميل الملف الشخصي
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Could not load this profile. Please try again.
      </p>
      {error?.message ? (
        <p className="max-w-sm rounded bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {error.message}
          {error.digest ? ` (${error.digest})` : ""}
        </p>
      ) : null}
      <button
        onClick={reset}
        className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        type="button"
      >
        إعادة المحاولة · Retry
      </button>
    </div>
  );
}
