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

  type IconKey = "home" | "explore" | "market" | "orders" | "profile";
  const NavIcon = ({ name, active }: { name: IconKey; active: boolean }) => {
    const stroke = active ? "var(--bina-primary)" : "#C8C8C8";
    const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (name) {
      case "home":
        return (
          <svg {...common}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "explore":
        return (
          <svg {...common}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case "market":
        return (
          <svg {...common}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
        );
      case "orders":
        return (
          <svg {...common}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        );
      case "profile":
        return (
          <svg {...common}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
    }
  };

  const itemCls = (href: string) =>
    `flex flex-col items-center gap-0.5 min-w-0 flex-1 cursor-pointer select-none py-1 ${
      isActive(href) ? "text-[var(--bina-primary)]" : "text-[#C8C8C8]"
    }`;

  return (
    <nav
      aria-label={t("mainNavAria")}
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end border-t border-[var(--bina-border)] bg-white px-1.5"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", paddingTop: "0.5rem" }}
    >
      {/* HOME */}
      <Link href={homeHref} className={itemCls(homeHref)} aria-label={t("feed")} prefetch>
        <NavIcon name="home" active={isActive(homeHref)} />
        <span className="text-[10px] font-medium">{t("feed")}</span>
      </Link>

      {/* MARKET / EXPLORE */}
      <Link href="/gallery" className={itemCls("/gallery")} aria-label={t("market")} prefetch>
        <NavIcon name="explore" active={isActive("/gallery")} />
        <span className="text-[10px] font-medium">{t("market")}</span>
      </Link>

      {/* CENTER FAB — compose */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
        <Link
          href="/posts/new"
          aria-label={t("composePostAria")}
          prefetch
          className="mb-2.5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[var(--bina-primary)] text-white shadow-[0_4px_12px_rgba(183,28,28,0.4)] transition-transform active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </Link>
      </div>

      {/* NEARBY → reusing map as "orders-style" slot but keeping current destination */}
      <Link href="/map" className={`relative ${itemCls("/map")}`} aria-label={t("nearby")} prefetch>
        <NavIcon name="orders" active={isActive("/map")} />
        <span className="text-[10px] font-medium">{t("nearby")}</span>
      </Link>

      {/* PROFILE */}
      <Link href="/profile" className={itemCls("/profile")} aria-label={t("profile")} prefetch>
        <NavIcon name="profile" active={isActive("/profile")} />
        <span className="text-[10px] font-medium">{t("profile")}</span>
      </Link>
    </nav>
  );
}
