"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { FeedPostCard } from "@/components/feed-post-card";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { FeedRfqCard } from "@/components/feed-rfq-card";
import { FeedVeteransCard } from "@/components/feed-veterans-card";
import type { FeedPostItem } from "@/lib/feed/fetch-feed-posts";

type Props = {
  posts: FeedPostItem[];
  forYouPosts: FeedPostItem[];
  nearMePosts: FeedPostItem[];
  veteranPost: FeedPostItem | null;
  latestRfq: FeedRfqItem | null;
  viewerId: string | null;
  refreshKey: number;
};

export function FeedTabStrip({ posts, forYouPosts, nearMePosts, veteranPost, latestRfq, viewerId, refreshKey }: Props) {
  const t = useTranslations("feed");
  const [tab, setTab] = useState<"forYou" | "latest" | "nearMe">("forYou");

  const tabs: { key: "forYou" | "latest" | "nearMe"; label: string }[] = [
    { key: "forYou", label: t("forYou") },
    { key: "latest", label: t("latest") },
    { key: "nearMe", label: t("nearMe") },
  ];

  const sorted =
    tab === "latest"
      ? [...posts].sort((a, b) => b.created_at.localeCompare(a.created_at))
      : tab === "forYou"
        ? forYouPosts
        : nearMePosts;

  const feed: React.ReactNode[] = [];

  if (veteranPost) {
    feed.push(
      <FeedVeteransCard
        key={`veteran-${veteranPost.id}-${refreshKey}`}
        item={veteranPost}
        viewerId={viewerId}
      />
    );
  }
  if (latestRfq) {
    feed.push(<FeedRfqCard key={`rfq-${latestRfq.id}`} item={latestRfq} />);
  }

  sorted.forEach((item, i) => {
    feed.push(
      <FeedPostCard
        key={`${item.id}-${refreshKey}`}
        item={item}
        viewerId={viewerId}
        priority={i === 0}
      />
    );
  });

  const hasAny = feed.length > 0;

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--bina-border)] bg-[var(--bina-steel)] px-3 pb-2 pt-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            type="button"
            className={`font-bina-display rounded-full px-3 py-[4px] text-[10px] font-semibold uppercase tracking-wide transition-all ${
              tab === key
                ? "bg-[var(--bina-or)] text-white"
                : "text-[var(--bina-muted)] hover:text-[var(--bina-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-8 pt-3">
        {feed}
        {!hasAny ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-[var(--bina-muted)]">{t("empty")}</p>
            <Link
              href="/posts/new"
              className="font-bina-display rounded-full bg-[var(--bina-or)] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white"
            >
              {t("createPostCta")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
