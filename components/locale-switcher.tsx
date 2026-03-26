"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { switchLocale } from "@/lib/i18n/switch-locale";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div
      aria-label={t("ariaLabel")}
      className={`inline-flex rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800/80 ${className ?? ""}`}
      role="group"
    >
      <button
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === "ar"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        disabled={pending}
        type="button"
        onClick={() => startTransition(() => void switchLocale("ar", pathname))}
      >
        العربية
      </button>
      <button
        className={`rounded-md px-2 py-1 transition-colors ${
          locale === "en"
            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
        disabled={pending}
        type="button"
        onClick={() => startTransition(() => void switchLocale("en", pathname))}
      >
        English
      </button>
    </div>
  );
}
