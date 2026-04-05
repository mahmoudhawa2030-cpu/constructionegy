"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

import { FeedPostSocialBar } from "@/components/feed-post-social-bar";
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
  const age = relativeAge(item.created_at, locale);

  return (
    <div
      className="mb-3 overflow-hidden rounded-[var(--bina-r)] border border-[var(--bina-gold)]"
      style={{ background: "linear-gradient(135deg,#1e1a0e,#242016)" }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-[5px]"
        style={{ background: "linear-gradient(90deg,#3d2a00,#2e2000)", borderBottom: "1px solid #604010" }}
      >
        <span className="text-[13px]">★</span>
        <span className="font-bina-display text-[10px] font-black uppercase tracking-[1px] text-[var(--bina-gold)]">
          VETERANS CORNER
        </span>
        <span className="mx-1 text-[var(--bina-gold)] opacity-50">·</span>
        <span className="font-bina-display text-[10px] font-black text-[var(--bina-gold)]">حكمة الخبراء</span>
        <span className="ms-auto rounded border border-[#604010] bg-[#3d2a00] px-1.5 py-px font-bina-display text-[8px] font-bold text-[var(--bina-gold)]">
          ★ VETERAN
        </span>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="mb-2 flex items-center gap-2">
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
                ★ VETERAN
              </span>
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
