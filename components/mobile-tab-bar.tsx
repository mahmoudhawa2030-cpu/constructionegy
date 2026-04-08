"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

type Props = {
  homeHref?: string;
};

export function MobileTabBar({ homeHref = "/" }: Props) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function isActive(href: string) {
    if (href === homeHref) return pathname === homeHref;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const cls = (href: string) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 min-h-[3rem] cursor-pointer select-none transition-colors ${
      isActive(href) ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"
    }`;

  const icon = (emoji: string, href: string) => (
    <span
      className={`flex h-[22px] w-[22px] items-center justify-center text-[16px] leading-none transition-colors ${isActive(href) ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"}`}
    >
      {emoji}
    </span>
  );

  const label = (text: string, href: string) => (
    <span
      className={`font-bina-display text-[8px] font-semibold uppercase tracking-[0.06em] leading-none ${isActive(href) ? "text-[var(--bina-or)]" : "text-[var(--bina-muted)]"}`}
    >
      {text}
    </span>
  );

  return (
    <nav
      aria-label={t("mainNavAria")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--bina-border)] bg-[var(--bina-steel2)] shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="flex items-center justify-around px-1 pt-2">

        {/* FEED */}
        <li className={cls(homeHref)}>
          <Link href={homeHref} className={cls(homeHref)} aria-label={t("feed")} prefetch>
            {icon("🏠", homeHref)}
            {label(t("feed"), homeHref)}
          </Link>
        </li>

        {/* MARKET */}
        <li className={cls("/gallery")}>
          <Link href="/gallery" className={cls("/gallery")} aria-label={t("market")} prefetch>
            {icon("🏪", "/gallery")}
            {label(t("market"), "/gallery")}
          </Link>
        </li>

        {/* CENTER + FAB — industry feed: new post (listings from Market / gallery flows) */}
        <li className="flex min-w-0 flex-1 flex-col items-center justify-center">
          <Link
            href="/posts/new"
            aria-label={t("composePostAria")}
            prefetch
            className="relative -mt-4 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--bina-or)] text-white shadow-[0_0_0_4px_var(--bina-steel2),0_4px_14px_rgba(230,120,40,0.45)] transition-transform active:scale-95"
          >
            <span className="text-[26px] font-light leading-none">+</span>
          </Link>
        </li>

        {/* NEARBY */}
        <li className={cls("/map")}>
          <Link href="/map" className={cls("/map")} aria-label={t("nearby")} prefetch>
            {icon("📍", "/map")}
            {label(t("nearby"), "/map")}
          </Link>
        </li>

        {/* PROFILE */}
        <li className={cls("/profile")}>
          <Link href="/profile" className={cls("/profile")} aria-label={t("profile")} prefetch>
            {icon("👤", "/profile")}
            {label(t("profile"), "/profile")}
          </Link>
        </li>

      </ul>
    </nav>
  );
}
