"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function WebHero() {
  const t = useTranslations("home");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--bina-primary)] to-[#8B1515]">
      <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
        <div className="max-w-2xl">
          <h1 className="font-bina-display text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-lg text-white/80">
            {t("heroSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/gallery"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[var(--bina-primary)] transition-colors hover:bg-white/90"
            >
              {t("browseProducts")}
            </Link>
            <Link
              href="/rfq"
              className="rounded-lg border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("postRfq")}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-10">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}
