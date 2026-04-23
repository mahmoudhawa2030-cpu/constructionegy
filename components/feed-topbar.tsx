"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { useMessageNotifications } from "@/components/message-notifications-provider";
import { useCommentNotifications } from "@/components/comment-notifications-provider";

const TOOLS = [
  { key: "scanner", icon: "📄", href: "/tools/scanner" },
  { key: "counter", icon: "🔢", href: "/tools/counter" },
  { key: "profileViews", icon: "👁", href: "/tools/profile-views" },
  { key: "dwgViewer", icon: "📐", href: "/tools/dwg-viewer" },
] as const;

export function FeedTopbar() {
  const t = useTranslations("nav");
  const tTools = useTranslations("toolsMenu");
  const { openMenu } = useMobileChromeMenu();
  const { unreadTotal } = useMessageNotifications();
  const { unreadCount } = useCommentNotifications();
  const router = useRouter();

  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setToolsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [toolsOpen]);

  return (
    <div
      className="sticky top-0 z-30 border-b border-[var(--bina-border)] bg-[var(--bina-steel2)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
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
          {/* Tools dropdown */}
          <div ref={toolsRef} className="relative">
            <button
              type="button"
              aria-label={tTools("menuAria")}
              aria-expanded={toolsOpen}
              onClick={() => setToolsOpen((v) => !v)}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70 ${toolsOpen ? "ring-2 ring-[var(--bina-or)]" : ""}`}
            >
              🔧
            </button>

            {toolsOpen ? (
              <div className="absolute end-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow-2xl">
                {TOOLS.map(({ key, icon, href }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setToolsOpen(false);
                      router.push(href);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[var(--bina-steel3)] active:opacity-70"
                  >
                    <span className="text-[18px] leading-none">{icon}</span>
                    <span className="font-bina-display text-[12px] font-semibold text-[var(--bina-text)]">
                      {tTools(key)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Notifications bell */}
          <Link
            href="/notifications"
            aria-label={unreadCount > 0 ? t("notificationsAriaWithUnread", { count: unreadCount }) : t("notificationsAria")}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
          >
            🔔
            {unreadCount > 0 ? (
              <span className="font-bina-display absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--bina-or)] px-0.5 text-[7px] font-bold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>

          {/* Messages */}
          <Link
            href="/messages"
            aria-label={t("messages")}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bina-border)] bg-[var(--bina-steel3)] text-[13px] transition-opacity active:opacity-70"
          >
            💬
            {unreadTotal > 0 ? (
              <span className="font-bina-display absolute -right-0.5 -top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[var(--bina-red)] px-0.5 text-[7px] font-bold leading-none text-white">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
