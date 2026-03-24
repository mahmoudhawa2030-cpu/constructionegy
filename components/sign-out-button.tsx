"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Props = {
  /** Smaller padding for dense headers (e.g. sticky app bar). */
  compact?: boolean;
};

export function SignOutButton({ compact }: Props = {}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={
        compact
          ? "rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          : "rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      }
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
      }}
    >
      تسجيل الخروج
    </button>
  );
}
