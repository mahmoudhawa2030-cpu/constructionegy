"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { FeedPostCard } from "@/components/feed-post-card";
import { ProfileListingsGrid } from "@/components/profile-listings-grid";
import type { FeedPostItem } from "@/lib/feed/feed-post-types";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type Props = {
  listings: ListingRow[];
  posts: FeedPostItem[];
  categoryLabelMap: Record<string, string>;
  viewerUserId: string | null;
  emptyListings: string;
};

export function ProfileTabStrip({
  listings,
  posts,
  categoryLabelMap,
  viewerUserId,
  emptyListings,
}: Props) {
  const t = useTranslations("publicProfile");
  const [tab, setTab] = useState<"classifieds" | "posts">("classifieds");

  const tabs: { key: "classifieds" | "posts"; label: string }[] = [
    { key: "classifieds", label: t("tabClassifieds") },
    { key: "posts", label: t("tabPosts") },
  ];

  return (
    <div>
      <div
        className="flex gap-1 border-b border-[var(--bina-border)] bg-[var(--bina-steel)] px-2.5 pb-2 pt-1.5"
        role="tablist"
        aria-label={t("tabClassifieds") + " / " + t("tabPosts")}
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            id={`profile-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            type="button"
            className={`font-bina-display min-h-[28px] flex-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all ${
              tab === key
                ? "bg-[var(--bina-or)] text-white shadow-[0_2px_8px_rgba(230,120,40,0.35)]"
                : "text-[var(--bina-muted)] hover:text-[var(--bina-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-2.5 pb-6 pt-3 sm:px-3">
        {tab === "classifieds" ? (
          <ProfileListingsGrid
            listings={listings}
            empty={emptyListings}
            categoryLabelMap={categoryLabelMap}
            viewerUserId={viewerUserId}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                {t("emptyPosts")}
              </div>
            ) : (
              posts.map((item) => (
                <FeedPostCard
                  key={item.id}
                  item={item}
                  viewerId={viewerUserId}
                  priority={false}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
