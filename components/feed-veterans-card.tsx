"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

import type { FeedListingItem } from "@/components/industry-feed";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

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

export function FeedVeteransCard({ item }: { item: FeedListingItem }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const age = relativeAge(item.created_at, locale);

  return (
    <div className="mb-3 overflow-hidden rounded-[var(--bina-r)] border border-[var(--bina-gold)]" style={{ background: "linear-gradient(135deg,#1e1a0e,#242016)" }}>
      {/* Veteran ribbon */}
      <div className="flex items-center gap-1.5 px-3 py-[5px]" style={{ background: "linear-gradient(90deg,#3d2a00,#2e2000)", borderBottom: "1px solid #604010" }}>
        <span className="text-[13px]">★</span>
        <span className="font-bina-display text-[10px] font-black uppercase tracking-[1px] text-[var(--bina-gold)]">
          VETERANS CORNER
        </span>
        <span className="mx-1 text-[var(--bina-gold)] opacity-50">·</span>
        <span className="font-bina-display text-[10px] font-black text-[var(--bina-gold)]">حكمة الخبراء</span>
        <span className="ms-auto rounded bg-[#3d2a00] border border-[#604010] px-1.5 py-px font-bina-display text-[8px] font-bold text-[var(--bina-gold)]">
          ★ VETERAN
        </span>
      </div>

      <div className="px-3 pt-3 pb-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bina-display text-[12px] font-bold"
            style={{ background: "#3d2e0a", color: "var(--bina-gold)" }}
          >
            {initials(item.seller_name)}
          </span>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bina-display text-[11px] font-bold text-[var(--bina-gold)]">
                {item.seller_name}
              </span>
              <span className="rounded bg-[#3d2a00] border border-[#604010] px-1 py-px font-bina-display text-[8px] font-bold text-[var(--bina-gold)]">
                ★ VETERAN
              </span>
            </div>
            <div className="font-bina-display text-[9px] text-[var(--bina-muted)]">
              {item.seller_role}
              {item.location ? ` · ${item.location}` : ""}
              {" · "}{age}
            </div>
          </div>
        </div>

        {/* Content */}
        <Link href={`/listings/${item.id}`} prefetch>
          <h3 className="font-bina-display text-[12px] font-bold leading-snug text-[var(--bina-text)] mb-1 hover:text-[var(--bina-gold)] transition-colors">
            {item.title}
          </h3>
        </Link>
        <p className="text-[10px] leading-relaxed text-[var(--bina-muted)] line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex border-t border-[#604010]">
        <div className="flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-semibold text-[var(--bina-muted)] border-r border-[#604010] cursor-pointer">
          <span className="text-[11px]">👏</span> {isAr ? "إعجاب" : "Like"}
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-semibold text-[var(--bina-muted)] border-r border-[#604010] cursor-pointer">
          <span className="text-[11px]">💬</span> {isAr ? "تعليق" : "Comment"}
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 py-[7px] font-bina-display text-[9px] font-bold text-[var(--bina-or)] cursor-pointer">
          {isAr ? "اسأل المرشد" : "Ask Mentor"}
        </div>
      </div>
    </div>
  );
}
