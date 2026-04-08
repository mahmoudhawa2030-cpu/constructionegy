"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export type FeedRfqItem = {
  id: string;
  title: string;
  location?: string | null;
  created_at: string;
  quote_count: number;
};

function relativeAge(iso: string, locale: string) {
  const diff = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (diff < 60) return rtf.format(-diff, "second");
  const m = Math.floor(diff / 60);
  if (m < 60) return rtf.format(-m, "minute");
  const h = Math.floor(m / 60);
  if (h < 48) return rtf.format(-h, "hour");
  return rtf.format(-Math.floor(h / 24), "day");
}

export function FeedRfqCard({ item }: { item: FeedRfqItem }) {
  const locale = useLocale();
  const t = useTranslations("feed");
  const age = relativeAge(item.created_at, locale);

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--bina-border)] border-l-[4px] border-l-[var(--bina-blue)] bg-[var(--bina-steel2)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
      <div className="px-4 pt-3 pb-3">
        <div className="font-bina-display mb-1.5 text-[9px] font-black tracking-wide text-[var(--bina-blue)] uppercase">
          {t("rfqOpenForQuotes")}
        </div>
        <h3 className="font-bina-display mb-1.5 text-[12px] font-bold leading-snug text-[var(--bina-text)]">{item.title}</h3>
        <div className="mb-3 text-[9px] text-[var(--bina-muted)]" suppressHydrationWarning>
          {item.location ? `${item.location} · ` : ""}
          {t("rfqVerifiedBuyer")} · {age}
        </div>
        <div className="flex min-h-[44px] items-stretch justify-between gap-3 border-t border-[var(--bina-border)] pt-3">
          <span className="inline-flex flex-1 items-center justify-center rounded-lg border-2 border-[#3d7eff] bg-transparent px-3 py-2 font-bina-display text-[10px] font-black uppercase tracking-wide text-[#7ab8ff]">
            {item.quote_count} {t("rfqQuotes")}
          </span>
          <Link
            href="/rfq"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--bina-or)] px-3 py-2 text-center font-bina-display text-[10px] font-black uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(230,120,40,0.4)] transition-opacity active:opacity-85"
          >
            {t("rfqSubmitQuote")}
          </Link>
        </div>
      </div>
    </div>
  );
}
