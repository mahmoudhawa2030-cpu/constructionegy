"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { useMessageNotifications } from "@/components/message-notifications-provider";
import { useCommentNotifications } from "@/components/comment-notifications-provider";
import { isEnabled } from "@/lib/config/features";

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
  const socialEnabled = isEnabled("social");
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

  const TRENDING = ["HEPA filters", "Servo motors", "Safety gloves", "Pneumatic valves", "CNC parts", "Bulk packaging"];

  return (
    <div
      className="sticky top-0 z-30 bg-[var(--bina-primary)]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Top row: location + icons */}
      <div className="flex items-center justify-between px-4 pt-2">
        <button
          type="button"
          onClick={openMenu}
          className="flex items-center gap-1 text-white active:opacity-70"
        >
          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-[12px]">
            Ship to&nbsp;<span className="font-medium text-[var(--bina-accent)]">Cairo, EG ▾</span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          {/* Notifications (hidden when social disabled) */}
          {socialEnabled ? (
            <Link
              href="/notifications"
              aria-label={unreadCount > 0 ? t("notificationsAriaWithUnread", { count: unreadCount }) : t("notificationsAria")}
              className="relative active:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] rounded-full bg-[var(--bina-accent)] px-1 text-center text-[9px] font-bold leading-[14px] text-[var(--bina-on-accent)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}

          {/* Messages */}
          <Link href="/messages" aria-label={t("messages")} className="relative active:opacity-70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {unreadTotal > 0 ? (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] rounded-full bg-[var(--bina-accent)] px-1 text-center text-[9px] font-bold leading-[14px] text-[var(--bina-on-accent)]">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            ) : null}
          </Link>

          {/* Profile */}
          <Link href="/profile" aria-label={t("profile")} className="active:opacity-70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Brand row */}
      <div className="flex items-center justify-between px-4 pt-1.5 pb-2.5">
        <div>
          <div className="font-bina-display text-[22px] font-bold leading-none tracking-tight text-white">
            BINA<span className="text-[var(--bina-accent)]">Hub</span>
          </div>
          <div className="mt-0.5 text-[11px] text-white/65">B2B Wholesale Platform · 50,000+ Products</div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 active:opacity-80"
          style={{ background: "linear-gradient(135deg,#FFCA28,#FF8F00)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#7B1A1A">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-[11px] font-bold text-[var(--bina-on-accent)]">GOLD VIP</span>
        </button>
      </div>

      {/* Search row */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        <Link
          href="/gallery"
          className="flex flex-1 items-center gap-2 rounded-[10px] bg-white px-3 py-2.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 text-[13px] text-[#C0C0C0]">HEPA filters, safety gear, valves…</span>
        </Link>

        {/* Tools dropdown */}
        <div ref={toolsRef} className="relative">
          <button
            type="button"
            aria-label={tTools("menuAria")}
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen((v) => !v)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-white/15 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {toolsOpen ? (
            <div className="absolute end-0 top-[48px] z-50 w-52 overflow-hidden rounded-2xl border border-[var(--bina-border)] bg-white shadow-2xl">
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
      </div>

      {/* Trending chips */}
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFCA28]/20 px-2.5 py-1 text-[11px] text-[var(--bina-accent)]">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="rgba(255,202,40,0.8)">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          HEPA filters
        </div>
        {TRENDING.slice(1).map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/90"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
