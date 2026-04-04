"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { FeedPostSocialBar } from "@/components/feed-post-social-bar";
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

/** Avoid showing the same line again when `title` is derived from the start of `body`. */
function bodySnippetAfterTitle(title: string, body: string): string | null {
  const t = title.trim();
  const b = body.trim();
  if (!b) return null;
  if (!t || t === "—") return b;
  if (b === t) return null;
  if (b.startsWith(t)) {
    const rest = b.slice(t.length).replace(/^[\s\n\r]+/, "").trim();
    return rest.length > 0 ? rest : null;
  }
  const firstLine = b.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? "";
  if (firstLine.length > 0 && t === firstLine) {
    const idx = b.indexOf(firstLine);
    const rest = (idx >= 0 ? b.slice(idx + firstLine.length) : b).replace(/^[\s\n\r]+/, "").trim();
    return rest.length > 0 ? rest : null;
  }
  return b;
}

type Props = {
  item: FeedPostItem;
  viewerId: string | null;
  priority?: boolean;
};

export function FeedPostCard({ item, viewerId, priority }: Props) {
  const t = useTranslations("feed");
  const locale = useLocale();
  const av = avStyle(item.user_id);
  const age = relativeAge(item.created_at, locale);
  const thumb = item.images?.[0];
  const profileHref = `/profile/${item.user_id}`;

  const metaLine = [
    item.author_role,
    item.location ? item.location : null,
    age,
  ]
    .filter(Boolean)
    .join(" · ");

  const textBelowFold = bodySnippetAfterTitle(item.title, item.body);

  return (
    <article className="mb-4 overflow-hidden rounded-xl border border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
      <header className="flex items-start gap-3 px-4 pt-4 pb-1">
        <Link
          aria-label={t("openAuthorProfileAria", { name: item.author_name })}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--bina-or)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bina-steel2)]"
          href={profileHref}
          prefetch
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full font-bina-display text-sm font-bold tracking-tight"
            style={{ background: av.bg, color: av.color }}
          >
            {initials(item.author_name)}
          </span>
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              className="font-bina-display text-[15px] font-semibold leading-tight text-[var(--bina-text)] decoration-[var(--bina-or)]/50 underline-offset-2 hover:text-[var(--bina-or)] hover:underline"
              href={profileHref}
              prefetch
            >
              {item.author_name}
            </Link>
            {item.is_pro ? (
              <span
                aria-label={t("proBadgeAria")}
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-bina-display text-[10px] font-bold leading-none text-white"
                style={{ background: "#0a66c2" }}
              >
                <span aria-hidden className="text-[9px]">
                  ✓
                </span>
                PRO
              </span>
            ) : null}
          </div>
          <p
            className="mt-1 font-bina-display text-[12px] leading-snug text-[var(--bina-muted)]"
            suppressHydrationWarning
          >
            {metaLine}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-[#4a3016] bg-[#2a1c0c] px-2 py-1 font-bina-display text-[10px] font-bold text-[var(--bina-or)]">
          {t("postKind")}
        </span>
      </header>

      <Link
        aria-label={t("openPostAria", { title: item.title })}
        className="block"
        href={`/posts/${item.id}`}
        prefetch
      >
        <div
          className={
            thumb
              ? "relative aspect-video w-full bg-[var(--bina-steel3)]"
              : "relative flex min-h-[100px] w-full items-center justify-center bg-gradient-to-br from-[var(--bina-steel3)] to-[var(--bina-steel4)] px-6 sm:min-h-[120px]"
          }
        >
          {thumb ? (
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 42rem"
              src={thumb}
              unoptimized={thumb.startsWith("http")}
              priority={priority}
            />
          ) : (
            <span className="select-none text-5xl drop-shadow-sm sm:text-6xl" aria-hidden>
              📝
            </span>
          )}
        </div>
      </Link>

      <div className="border-t border-[var(--bina-border)]/80 px-4 py-3">
        <Link href={`/posts/${item.id}`} prefetch>
          <h2 className="font-bina-display text-start text-[15px] font-semibold leading-snug text-[var(--bina-text)] transition-colors hover:text-[var(--bina-or)] line-clamp-4">
            {item.title}
          </h2>
        </Link>
        {textBelowFold ? (
          <p className="mt-2 line-clamp-5 text-start text-[13px] leading-relaxed text-[var(--bina-muted)]">{textBelowFold}</p>
        ) : null}
      </div>

      <FeedPostSocialBar
        postId={item.id}
        title={item.title}
        initialLikeCount={item.likeCount}
        initialCommentCount={item.commentCount}
        initialLiked={item.likedByViewer}
        initialSaved={item.savedByViewer}
        viewerId={viewerId}
        layout="linkedin"
      />
    </article>
  );
}
