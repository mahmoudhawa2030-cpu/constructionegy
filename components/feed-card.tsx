"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

import type { FeedListingItem } from "@/components/industry-feed";

const CATEGORY_EMOJI: Record<string, string> = {
  scaffolding: "🏗️",
  cement: "🏛️",
  sand: "⛏️",
  steel: "🔩",
  wood: "🪵",
  electrical: "⚡",
  plumbing: "🔧",
  equipment: "🚧",
  safety: "🦺",
  prefab: "🏠",
};
function emojiForCategory(slug: string) {
  return CATEGORY_EMOJI[slug] ?? "🏗️";
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AV_STYLES = [
  { bg: "#B85E10", color: "#FFA040" },
  { bg: "#1a3d6e", color: "#3A8FE8" },
  { bg: "#1a3d2e", color: "#2ECC71" },
  { bg: "#3d2e0a", color: "#D4A027" },
];
function avStyle(userId: string) {
  const sum = Array.from(userId).reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV_STYLES[sum % AV_STYLES.length];
}

const TYPE_TAG: Record<string, { label_en: string; label_ar: string; cls: string }> = {
  sell: { label_en: "SELL", label_ar: "بيع", cls: "bg-[#3d2000] text-[#FFA040] border-[#703800]" },
  rent: { label_en: "RENT", label_ar: "إيجار", cls: "bg-[#0a1e3d] text-[#60AFFF] border-[#1a3a70]" },
};

type Props = {
  item: FeedListingItem;
  priority?: boolean;
};

export function FeedCard({ item, priority }: Props) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const av = avStyle(item.user_id);
  const age = relativeAge(item.created_at, locale);
  const emoji = emojiForCategory(item.category);
  const typeTag = TYPE_TAG[item.type];
  const priceFmt = new Intl.NumberFormat(isAr ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Number(item.price));
  const thumb = item.images?.[0];

  return (
    <div className="mb-3 overflow-hidden rounded-[10px] border border-[var(--bina-border)] bg-[var(--bina-steel2)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bina-display text-[12px] font-bold"
          style={{ background: av.bg, color: av.color }}
        >
          {initials(item.seller_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-bina-display text-[11px] font-bold leading-tight text-[var(--bina-text)]">
              {item.seller_name}
            </span>
            {item.is_pro ? (
              <span className="rounded border border-[#1a4a80] bg-[#0a2a50] px-1 py-px font-bina-display text-[8px] font-bold text-[var(--bina-blue)]">
                ✓ PRO
              </span>
            ) : null}
          </div>
          <div className="font-bina-display text-[9px] text-[var(--bina-muted)]" suppressHydrationWarning>
            {item.seller_role}
            {item.location ? ` · ${item.location}` : ""}
            {" · "}
            {age}
          </div>
        </div>
        {typeTag ? (
          <span className={`rounded border px-1.5 py-0.5 font-bina-display text-[9px] font-bold ${typeTag.cls}`}>
            {isAr ? typeTag.label_ar : typeTag.label_en}
          </span>
        ) : null}
      </div>

      {/* Image / emoji placeholder */}
      <Link href={`/listings/${item.id}`} prefetch className="block">
        <div className="relative h-[76px] w-full overflow-hidden" style={{ background: "linear-gradient(135deg,var(--bina-steel3),var(--bina-steel4))" }}>
          {thumb ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="100vw"
              src={thumb}
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <span className="font-bina-display max-w-[60%] line-clamp-2 text-[11px] font-semibold text-[var(--bina-muted)]">
                {item.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Title + body */}
      <div className="px-3 pt-2 pb-1">
        <Link href={`/listings/${item.id}`} prefetch>
          <h3 className="mb-1 line-clamp-2 font-bina-display text-[12px] font-bold leading-snug text-[var(--bina-text)] transition-colors hover:text-[var(--bina-or)]">
            {item.title}
          </h3>
        </Link>
        <p className="mb-2 line-clamp-2 text-[10px] leading-relaxed text-[var(--bina-muted)]">
          {item.description}
        </p>

        {/* Tags */}
        <div className="mb-2 flex flex-wrap gap-1">
          <span className="rounded border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-[7px] py-[2px] font-bina-display text-[9px] font-semibold uppercase text-[var(--bina-muted)]">
            {item.category.replace("_", " ")}
          </span>
          {item.condition === "new" ? (
            <span className="rounded border border-[#1a5e32] bg-[#0d2e18] px-[7px] py-[2px] font-bina-display text-[9px] font-semibold text-[#3EDD80]">
              {isAr ? "جديد" : "NEW"}
            </span>
          ) : (
            <span className="rounded border border-[#1a3a70] bg-[#0a1e3d] px-[7px] py-[2px] font-bina-display text-[9px] font-semibold text-[#60AFFF]">
              {isAr ? "مستعمل" : "USED"}
            </span>
          )}
          {item.location ? (
            <span className="rounded border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-[7px] py-[2px] font-bina-display text-[9px] font-semibold uppercase text-[var(--bina-muted)]">
              {item.location}
            </span>
          ) : null}
        </div>

        {/* Price */}
        <div>
          <span className="font-bina-display text-[15px] font-black text-[var(--bina-or)]">{priceFmt}</span>
          <span className="ml-1 text-[9px] text-[var(--bina-muted)]">{item.price_unit}</span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex border-t border-[var(--bina-border)] mt-1">
        {        (
          [
            { icon: "👍", label_en: "Like", label_ar: "إعجاب", primary: false },
            { icon: "💬", label_en: "Comment", label_ar: "تعليق", primary: false },
            { icon: "📤", label_en: "Share", label_ar: "مشاركة", primary: false },
            { icon: "🔖", label_en: "Save", label_ar: "حفظ", primary: true },
          ] as const
        ).map(({ icon, label_en, label_ar, primary }) => (
          <div
            key={label_en}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1 border-r border-[var(--bina-border)] py-[7px] font-bina-display text-[9px] font-semibold last:border-r-0 transition-opacity active:opacity-60 ${
              primary ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"
            }`}
          >
            <span className="text-[11px]">{icon}</span>
            {isAr ? label_ar : label_en}
          </div>
        ))}
      </div>
    </div>
  );
}
