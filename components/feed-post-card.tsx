"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import type { FeedPostItem } from "@/lib/feed/fetch-feed-posts";

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

type Props = {
  item: FeedPostItem;
  priority?: boolean;
};

export function FeedPostCard({ item, priority }: Props) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("feed");
  const av = avStyle(item.user_id);
  const age = relativeAge(item.created_at, locale);
  const thumb = item.images?.[0];

  return (
    <div className="mb-3 overflow-hidden rounded-[10px] border border-[var(--bina-border)] bg-[var(--bina-steel2)]">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bina-display text-[12px] font-bold"
          style={{ background: av.bg, color: av.color }}
        >
          {initials(item.author_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-bina-display text-[11px] font-bold leading-tight text-[var(--bina-text)]">
              {item.author_name}
            </span>
            {item.is_pro ? (
              <span className="rounded border border-[#1a4a80] bg-[#0a2a50] px-1 py-px font-bina-display text-[8px] font-bold text-[var(--bina-blue)]">
                ✓ PRO
              </span>
            ) : null}
          </div>
          <div className="font-bina-display text-[9px] text-[var(--bina-muted)]">
            {item.author_role}
            {item.location ? ` · ${item.location}` : ""}
            {" · "}
            {age}
          </div>
        </div>
        <span className="rounded border border-[#3d2000] bg-[#2a1808] px-1.5 py-0.5 font-bina-display text-[9px] font-bold text-[var(--bina-or)]">
          {t("postKind")}
        </span>
      </div>

      <Link href={`/posts/${item.id}`} prefetch className="block" aria-label={t("openPostAria", { title: item.title })}>
        <div
          className="relative h-[76px] w-full overflow-hidden"
          style={{ background: "linear-gradient(135deg,var(--bina-steel3),var(--bina-steel4))" }}
        >
          {thumb ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="100vw"
              src={thumb}
              unoptimized={thumb.startsWith("http")}
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center gap-2">
              <span className="text-3xl">📝</span>
              <span className="font-bina-display max-w-[60%] line-clamp-2 text-[11px] font-semibold text-[var(--bina-muted)]">
                {item.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="px-3 pt-2 pb-1">
        <Link href={`/posts/${item.id}`} prefetch>
          <h3 className="mb-1 line-clamp-2 font-bina-display text-[12px] font-bold leading-snug text-[var(--bina-text)] transition-colors hover:text-[var(--bina-or)]">
            {item.title}
          </h3>
        </Link>
        <p className="mb-2 line-clamp-3 text-[10px] leading-relaxed text-[var(--bina-muted)]">{item.body}</p>
        {item.location ? (
          <div className="mb-2 flex flex-wrap gap-1">
            <span className="rounded border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-[7px] py-[2px] font-bina-display text-[9px] font-semibold uppercase text-[var(--bina-muted)]">
              {item.location}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex border-t border-[var(--bina-border)]">
        {(
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
