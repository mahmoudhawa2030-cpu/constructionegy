"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { ExpertBadge } from "@/components/expert-badge";
import { FeedPostOwnerOverflowMenu } from "@/components/feed-post-owner-overflow-menu";
import { FeedPostSocialBar } from "@/components/feed-post-social-bar";
import { FeedVeteransCornerBanner } from "@/components/feed-veterans-corner-banner";
import type { FeedPostItem } from "@/lib/feed/fetch-feed-posts";

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

type Props = {
  item: FeedPostItem;
  viewerId: string | null;
  refreshKey?: number;
};

export function FeedVeteransCard({ item, viewerId, refreshKey = 0 }: Props) {
  const locale = useLocale();
  const t = useTranslations("feed");
  const tExpert = useTranslations("expertVerification");
  const age = relativeAge(item.created_at, locale);
  const isOwner = viewerId !== null && viewerId === item.user_id;

  return (
    <div
      className="mb-3 rounded-[var(--bina-r)] border border-[var(--bina-gold)]"
      style={{ background: "linear-gradient(135deg,#1e1a0e,#242016)" }}
    >
      <FeedVeteransCornerBanner />

      <div className="relative px-3 pt-3 pb-2">
        {isOwner ? <FeedPostOwnerOverflowMenu className="absolute end-2 top-2 z-20" postId={item.id} /> : null}
        <div className={`mb-2 flex items-center gap-2 ${isOwner ? "pe-10" : ""}`}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bina-display text-[12px] font-bold"
            style={{ background: "#3d2e0a", color: "var(--bina-gold)" }}
          >
            {initials(item.author_name)}
          </span>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bina-display text-[11px] font-bold text-[var(--bina-gold)]">
                {item.author_name}
              </span>
              <span className="rounded border border-[#604010] bg-[#3d2a00] px-1 py-px font-bina-display text-[8px] font-bold text-[var(--bina-gold)]">
                ★ {t("veteranBadge")}
              </span>
              {item.is_expert ? (
                <ExpertBadge
                  ariaLabel={tExpert("badgeAria")}
                  className="!text-[8px] !px-1 !py-px"
                  text={tExpert("badgeShort")}
                />
              ) : null}
            </div>
            <div className="font-bina-display text-[9px] text-[var(--bina-muted)]" suppressHydrationWarning>
              {item.author_role}
              {item.location ? ` · ${item.location}` : ""}
              {" · "}
              {age}
            </div>
          </div>
        </div>

        <Link href={`/posts/${item.id}`} prefetch>
          <h3 className="mb-1 font-bina-display text-[12px] font-bold leading-snug text-[var(--bina-text)] transition-colors hover:text-[var(--bina-gold)] line-clamp-2">
            {item.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-[10px] leading-relaxed text-[var(--bina-muted)]">{item.body}</p>
      </div>

      <FeedPostSocialBar
        postId={item.id}
        title={item.title}
        initialLikeCount={item.likeCount}
        initialCommentCount={item.commentCount}
        initialLiked={item.likedByViewer}
        initialSaved={item.savedByViewer}
        viewerId={viewerId}
        variant="veterans"
        refreshKey={refreshKey}
      />
    </div>
  );
}
