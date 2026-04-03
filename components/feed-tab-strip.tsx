"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { FeedListingItem } from "@/components/industry-feed";
import type { FeedRfqItem } from "@/components/feed-rfq-card";
import { FeedCard } from "@/components/feed-card";
import { FeedRfqCard } from "@/components/feed-rfq-card";
import { FeedVeteransCard } from "@/components/feed-veterans-card";

type Props = {
  /** Chronological pool (all tabs derive from the same snapshot). */
  items: FeedListingItem[];
  /** Personalized order for signed-in users; recency-only for guests. */
  forYouItems: FeedListingItem[];
  /** Location-scoped when profile has a place; else same as Latest. */
  nearMeItems: FeedListingItem[];
  rfqItems: FeedRfqItem[];
};

export function FeedTabStrip({ items, forYouItems, nearMeItems, rfqItems }: Props) {
  const t = useTranslations("feed");
  const [tab, setTab] = useState<"forYou" | "latest" | "nearMe">("forYou");

  const tabs: { key: "forYou" | "latest" | "nearMe"; label: string }[] = [
    { key: "forYou", label: t("forYou") },
    { key: "latest", label: t("latest") },
    { key: "nearMe", label: t("nearMe") },
  ];

  const sorted =
    tab === "latest"
      ? [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))
      : tab === "forYou"
        ? forYouItems
        : nearMeItems;

  // Build interleaved feed: every ~3 normal cards, inject a special card
  const feed: React.ReactNode[] = [];
  sorted.forEach((item, i) => {
    // After the 1st card — veterans corner (use the oldest/most-expensive item as the "veteran" post)
    if (i === 1 && sorted.length > 0) {
      const veteranItem = sorted[sorted.length - 1] ?? item;
      feed.push(<FeedVeteransCard key={`vet-${veteranItem.id}`} item={veteranItem} />);
    }
    // After the 3rd card — first RFQ teaser
    if (i === 3 && rfqItems.length > 0) {
      feed.push(<FeedRfqCard key={`rfq-0`} item={rfqItems[0]} />);
    }
    // After the 6th card — second RFQ teaser
    if (i === 6 && rfqItems.length > 1) {
      feed.push(<FeedRfqCard key={`rfq-1`} item={rfqItems[1]} />);
    }
    feed.push(<FeedCard key={item.id} item={item} priority={i === 0} />);
  });

  // If feed is empty, show RFQ teasers only
  if (sorted.length === 0) {
    rfqItems.forEach((r) => feed.push(<FeedRfqCard key={r.id} item={r} />));
  }

  return (
    <div>
      {/* Tab strip */}
      <div className="flex gap-1 px-3 pt-2 pb-2 bg-[var(--bina-steel)] border-b border-[var(--bina-border)]">
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

      {/* Cards */}
      <div className="px-3 pt-3 pb-8">
        {feed}
        {feed.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--bina-muted)]">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
