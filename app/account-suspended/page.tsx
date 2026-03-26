"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export default function AccountSuspendedPage() {
  const t = useTranslations("accountSuspended");
  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
    })();
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {t("body")}
      </p>
      <Link
        className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
        href="/login"
      >
        {t("login")}
      </Link>
    </div>
  );
}
