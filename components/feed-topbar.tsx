"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { useMessageNotifications } from "@/components/message-notifications-provider";

export function FeedTopbar() {
  const t = useTranslations("nav");
  const { openMenu } = useMobileChromeMenu();
  const { unreadTotal } = useMessageNotifications();

  return (
    <div
      className="sticky top-0 z-30 border-b border-[var(--bina-border)] bg-[var(--bina-steel2)]"
      style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-center justify-between px-2.5 py-2 max-[380px]:px-2 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            type="button"
            aria-label={t("openMenuAria")}
            onClick={openMenu}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[14px] text-[var(--bina-text)] transition-opacity active:opacity-70"
          >
            <span aria-hidden>☰</span>
          </button>
          <div className="min-w-0">
          <div className="font-bina-display text-[18px] font-black leading-none tracking-wide text-[var(--bina-or)] sm:text-[19px]">
            BINA
          </div>
          <div className="font-bina-display mt-0.5 text-[7px] font-semibold uppercase leading-none tracking-[0.16em] text-[var(--bina-muted)]">
            مصر &middot; EGYPT
          </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/messages"
            aria-label={t("messagesLinkAria")}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
          >
            🔔
            {unreadTotal > 0 ? (
              <span className="font-bina-display absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--bina-red)] px-0.5 text-[7px] font-bold leading-none text-white">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            ) : null}
          </Link>
          <Link
            href="/messages"
            aria-label={t("messages")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
          >
            💬
          </Link>
        </div>
      </div>
    </div>
  );
}
