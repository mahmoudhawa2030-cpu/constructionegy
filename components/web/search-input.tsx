"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const t = useTranslations("common");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/gallery?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-lg border border-[var(--bina-border)] bg-[var(--bina-steel)] px-4 py-2.5 pl-10 text-sm outline-none transition-colors placeholder:text-[var(--bina-muted)] focus:border-[var(--bina-primary)] focus:bg-white"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bina-muted)]"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--bina-primary)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--bina-primary-dark)]"
      >
        {t("search")}
      </button>
    </form>
  );
}
