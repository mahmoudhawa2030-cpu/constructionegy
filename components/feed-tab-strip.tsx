"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { FeedPostCard } from "@/components/feed-post-card";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { FeedRfqCard, FeedRfqEmptyCard } from "@/components/feed-rfq-card";
import { FeedSocialResyncContext } from "@/components/feed-social-resync-context";
import { FeedVeteransCard } from "@/components/feed-veterans-card";
import type { FeedPostItem } from "@/lib/feed/fetch-feed-posts";

type SocialPatch = {
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  savedByViewer: boolean;
};

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
  const resyncCtx = useContext(FeedSocialResyncContext);
  const [socialPatch, setSocialPatch] = useState<Record<string, SocialPatch>>({});

  const postIdKey = useMemo(() => {
    const ids = new Set(posts.map((p) => p.id));
    if (veteranPost) ids.add(veteranPost.id);
    return [...ids].sort().join(",");
  }, [posts, veteranPost]);

  const mergeItem = useCallback(
    (item: FeedPostItem): FeedPostItem => {
      const p = socialPatch[item.id];
      if (!p) return item;
      return {
        ...item,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        likedByViewer: p.likedByViewer,
        savedByViewer: p.savedByViewer,
      };
    },
    [socialPatch],
  );

  useEffect(() => {
    const gen = resyncCtx?.generation ?? 0;
    if (gen === 0) return;
    const ids = postIdKey.split(",").filter(Boolean);
    if (ids.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/feed/social-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postIds: ids }),
          credentials: "same-origin",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items?: Array<SocialPatch & { id: string }> };
        const rows = data.items ?? [];
        const next: Record<string, SocialPatch> = {};
        for (const row of rows) {
          next[row.id] = {
            likeCount: row.likeCount,
            commentCount: row.commentCount,
            likedByViewer: row.likedByViewer,
            savedByViewer: row.savedByViewer,
          };
        }
        if (!cancelled) setSocialPatch(next);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resyncCtx?.generation, postIdKey]);

  const mergedPosts = useMemo(() => posts.map(mergeItem), [posts, mergeItem]);
  const mergedForYou = useMemo(() => forYouPosts.map(mergeItem), [forYouPosts, mergeItem]);
  const mergedNear = useMemo(() => nearMePosts.map(mergeItem), [nearMePosts, mergeItem]);
  const mergedVeteran = veteranPost ? mergeItem(veteranPost) : null;

  const tabs: { key: "forYou" | "latest" | "nearMe"; label: string }[] = [
    { key: "forYou", label: t("forYou") },
    { key: "latest", label: t("latest") },
    { key: "nearMe", label: t("nearMe") },
  ];

  const sorted =
    tab === "latest"
      ? [...mergedPosts].sort((a, b) => b.created_at.localeCompare(a.created_at))
      : tab === "forYou"
        ? mergedForYou
        : mergedNear;

  const veteranId = mergedVeteran?.id ?? null;
  const postsSlot = veteranId ? sorted.filter((p) => p.id !== veteranId) : sorted;
  const [leadPost, ...restPosts] = postsSlot;

  const feed: React.ReactNode[] = [];

  // Mobile homepage: RFQ first, then user post card, then Veterans Corner (exact order requested).
  // RFQ card always appears first (real or empty state)
  if (latestRfq) {
    feed.push(<FeedRfqCard key={`rfq-${latestRfq.id}`} item={latestRfq} />);
  } else {
    feed.push(<FeedRfqEmptyCard key="rfq-empty" />);
  }

  if (leadPost) {
    feed.push(
      <FeedPostCard
        key={`${leadPost.id}-${refreshKey}`}
        item={leadPost}
        viewerId={viewerId}
        priority={true}
        refreshKey={refreshKey}
      />,
    );
  }

  // Veterans Corner remains the third card
  if (mergedVeteran) {
    feed.push(
      <FeedVeteransCard
        key={`veteran-${mergedVeteran.id}-${refreshKey}`}
        item={mergedVeteran}
        viewerId={viewerId}
        refreshKey={refreshKey}
      />,
    );
  }

  restPosts.forEach((item, i) => {
    feed.push(
      <FeedPostCard
        key={`${item.id}-${refreshKey}`}
        item={item}
        viewerId={viewerId}
        priority={false}
        refreshKey={refreshKey}
      />,
    );
  });

  const hasAny = feed.length > 0;

  return (
    <div>
      <div
        className="flex gap-1 border-b border-[var(--bina-border)] bg-[var(--bina-steel)] px-2.5 pb-2 pt-1.5 max-[380px]:px-2"
        role="tablist"
        aria-label={t("feedTabsAria")}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            id={`feed-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            type="button"
            className={`font-bina-display min-h-[28px] flex-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all max-[380px]:px-2 max-[380px]:text-[8px] ${
              tab === key
                ? "bg-[var(--bina-or)] text-white shadow-[0_2px_8px_rgba(230,120,40,0.35)]"
                : "text-[var(--bina-muted)] hover:text-[var(--bina-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-2.5 pb-6 pt-2 max-[380px]:px-2 sm:px-3">
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
