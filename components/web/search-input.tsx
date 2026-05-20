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
      <div className="flex items-center rounded-lg bg-[#1c1c1e] px-3 py-1 gap-2 ring-1 ring-transparent focus-within:ring-[var(--bina-primary)]">
        <svg
          className="shrink-0 text-zinc-400"
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
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-[var(--bina-primary)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--bina-primary-dk)] active:scale-95"
        >
          {t("search")}
        </button>
      </div>
    </form>
  );
}
