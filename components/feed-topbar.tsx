"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useMessageNotifications } from "@/components/message-notifications-provider";

export function FeedTopbar() {
  const t = useTranslations("nav");
  const { unreadTotal } = useMessageNotifications();

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      {/* Logo */}
      <div>
        <div className="font-bina-display text-[22px] font-black leading-none tracking-wide text-[var(--bina-or)]">
          BINA
        </div>
        <div className="font-bina-display mt-0.5 text-[7px] font-semibold uppercase leading-none tracking-[0.18em] text-[var(--bina-muted)]">
          مصر &middot; EGYPT
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Bell */}
        <Link
          href="/messages"
          aria-label={t("messagesLinkAria")}
          className="relative flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
        >
          🔔
          {unreadTotal > 0 ? (
            <span className="font-bina-display absolute -right-1 -top-1 flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-[var(--bina-or)] px-0.5 text-[7px] font-bold leading-none text-white">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          ) : null}
        </Link>
        {/* Chat */}
        <Link
          href="/messages"
          aria-label={t("messages")}
          className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
        >
          💬
        </Link>
      </div>
    </div>
  );
}
