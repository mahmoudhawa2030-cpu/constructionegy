"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

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
  const isAr = locale === "ar";
  const age = relativeAge(item.created_at, locale);

  return (
    <div className="mb-3 overflow-hidden rounded-[var(--bina-r)] border border-[var(--bina-border)] border-l-[3px] border-l-[var(--bina-blue)] bg-[var(--bina-steel2)]">
      <div className="px-3 pt-2.5 pb-2">
        <div className="font-bina-display mb-1 text-[9px] font-bold tracking-wide text-[var(--bina-blue)] uppercase">
          {isAr ? "طلب عروض · مفتوح للمزايدة" : "RFQ · OPEN FOR QUOTES"}
        </div>
        <h3 className="font-bina-display mb-1 text-[11px] font-bold leading-snug text-[var(--bina-text)]">
          {item.title}
        </h3>
        <div className="mb-2 text-[9px] text-[var(--bina-muted)]" suppressHydrationWarning>
          {item.location ? `${item.location} · ` : ""}
          {isAr ? "موثّق" : "Verified buyer"} · {age}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded border border-[#1a3a70] bg-[#0a1e3d] px-2 py-1 font-bina-display text-[9px] font-bold text-[#60AFFF] uppercase">
            {item.quote_count} {isAr ? "عروض" : "QUOTES"}
          </span>
          <Link
            href="/rfq"
            className="rounded-[6px] bg-[var(--bina-or)] px-3 py-1.5 font-bina-display text-[9px] font-bold text-white transition-opacity active:opacity-75"
          >
            {isAr ? "قدّم عرضاً" : "Submit Quote"}
          </Link>
        </div>
      </div>
    </div>
  );
}
