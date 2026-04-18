"use client";

import { useState, type ReactNode } from "react";

type Tab = "classifieds" | "posts";

type Props = {
  labelClassifieds: string;
  labelPosts: string;
  classifiedsContent: ReactNode;
  postsContent: ReactNode;
};

export function ProfileTabSwitcher({
  labelClassifieds,
  labelPosts,
  classifiedsContent,
  postsContent,
}: Props) {
  const [tab, setTab] = useState<Tab>("classifieds");

  const tabs: { key: Tab; label: string }[] = [
    { key: "classifieds", label: labelClassifieds },
    { key: "posts", label: labelPosts },
  ];

  return (
    <div>
      <div
        className="flex gap-1 border-b border-[var(--bina-border)] bg-[var(--bina-steel)] px-2.5 pb-2 pt-1.5"
        role="tablist"
        aria-label={`${labelClassifieds} / ${labelPosts}`}
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
        <div hidden={tab !== "classifieds"}>{classifiedsContent}</div>
        <div hidden={tab !== "posts"}>{postsContent}</div>
      </div>
    </div>
  );
}
