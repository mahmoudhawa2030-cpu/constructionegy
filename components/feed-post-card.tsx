"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { ExpertBadge } from "@/components/expert-badge";
import { FeedPostOwnerOverflowMenu } from "@/components/feed-post-owner-overflow-menu";
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
  refreshKey?: number;
};

export function FeedPostCard({ item, viewerId, priority, refreshKey = 0 }: Props) {
  const t = useTranslations("feed");
  const tExpert = useTranslations("expertVerification");
  const locale = useLocale();
  const av = avStyle(item.user_id);
  const [avatarError, setAvatarError] = useState(false);
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
  const locationTag = item.location?.trim();
  const isOwner = viewerId !== null && viewerId === item.user_id;

  return (
    <article className="mb-3 max-w-full overflow-hidden rounded-[12px] border border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow-[0_3px_14px_rgba(0,0,0,0.16)]">
      <header className="relative flex items-start gap-2 px-3 pt-2 pb-1.5 max-[380px]:px-2.5">
        <Link
          aria-label={t("openAuthorProfileAria", { name: item.author_name })}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--bina-or)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bina-steel2)]"
          href={profileHref}
          prefetch
        >
          {item.author_avatar_url && !avatarError ? (
            <img
              src={item.author_avatar_url}
              alt={item.author_name}
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full font-bina-display text-xs font-bold tracking-tight"
              style={{ background: av.bg, color: av.color }}
            >
              {initials(item.author_name)}
            </span>
          )}
        </Link>
        <div className={`min-w-0 flex-1 pt-px ${isOwner ? "pe-10" : ""}`}>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Link
              className="font-bina-display text-[14px] font-semibold leading-tight text-[var(--bina-text)] decoration-[var(--bina-or)]/50 underline-offset-2 hover:text-[var(--bina-or)] hover:underline"
              href={profileHref}
              prefetch
            >
              {item.author_name}
            </Link>
            {item.is_pro ? (
              <span
                aria-label={t("proBadgeAria")}
                className="inline-flex items-center gap-0.5 rounded px-1 py-px font-bina-display text-[9px] font-bold leading-none text-white"
                style={{ background: "#0a66c2" }}
              >
                <span aria-hidden className="text-[8px]">
                  ✓
                </span>
                PRO
              </span>
            ) : null}
            {item.is_expert ? (
              <ExpertBadge ariaLabel={tExpert("badgeAria")} text={tExpert("badgeShort")} />
            ) : null}
          </div>
          <p
            className="mt-0.5 font-bina-display text-[11px] leading-snug text-[var(--bina-muted)]"
            suppressHydrationWarning
          >
            {metaLine}
          </p>
        </div>
        {isOwner ? <FeedPostOwnerOverflowMenu className="absolute end-1.5 top-2.5 z-20" postId={item.id} /> : null}
      </header>

      {thumb ? (
        <Link
          aria-label={t("openPostAria", { title: item.title })}
          className="block overflow-hidden"
          href={`/posts/${item.id}`}
          prefetch
        >
          <div className="relative h-[330px] w-full bg-[var(--bina-steel3)] sm:h-[390px]">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 28rem"
              src={thumb}
              priority={priority}
            />
          </div>
        </Link>
      ) : null}

      <div className="px-3 pb-1.5 pt-1 max-[380px]:px-2.5">
        <div className="rounded-[10px] border border-[var(--bina-border)] bg-[var(--bina-steel3)] px-2.5 py-2">
          <Link href={`/posts/${item.id}`} prefetch>
            <h2 className="font-bina-display text-start text-[13px] font-bold leading-tight text-[var(--bina-text)] transition-colors hover:text-[var(--bina-or)] line-clamp-2">
              {item.title}
            </h2>
          </Link>
          {textBelowFold ? (
            <p className="mt-1 line-clamp-2 text-start text-[11px] leading-snug text-[var(--bina-muted)]">{textBelowFold}</p>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="rounded-md bg-[var(--bina-or)]/18 px-1.5 py-0.5 font-bina-display text-[8px] font-bold uppercase tracking-wide text-[var(--bina-or)]">
            {t("tagConcrete")}
          </span>
          <span className="rounded-md bg-[#1f4d2c]/50 px-1.5 py-0.5 font-bina-display text-[8px] font-bold uppercase tracking-wide text-[#6bdc8f]">
            {t("tagMilestone")}
          </span>
          {locationTag ? (
            <span className="rounded-md bg-[var(--bina-steel4)] px-1.5 py-0.5 font-bina-display text-[8px] font-bold uppercase tracking-wide text-[var(--bina-muted)]">
              {locationTag}
            </span>
          ) : null}
        </div>
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
        refreshKey={refreshKey}
      />
    </article>
  );
}
