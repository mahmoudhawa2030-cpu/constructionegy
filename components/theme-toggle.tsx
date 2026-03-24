"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { value: "light" as const, label: "فاتح" },
  { value: "dark" as const, label: "داكن" },
  { value: "system" as const, label: "النظام" },
];

type Props = {
  /** Shorter control for sticky headers (no «المظهر» label). */
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={
          compact
            ? "h-8 w-[min(100%,14rem)] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
            : "h-10 w-full max-w-xs animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800"
        }
      />
    );
  }

  const group = (
    <div
      className={`inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900 ${
        compact ? "max-w-full" : ""
      }`}
      role="group"
      aria-label="اختيار المظهر"
    >
      {options.map(({ value, label }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            className={`rounded-lg font-medium transition-colors ${
              compact
                ? `px-2 py-1.5 text-[11px] sm:px-2.5 sm:text-xs ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`
                : `px-3 py-2 text-xs sm:text-sm ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`
            }`}
            type="button"
            onClick={() => setTheme(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  if (compact) {
    return group;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">المظهر</p>
      {group}
    </div>
  );
}
