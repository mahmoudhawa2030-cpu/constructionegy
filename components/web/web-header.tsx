"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { SearchInput } from "./search-input";
import { UserNav } from "./user-nav";

type Props = {
  hasUser: boolean;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  unreadMessageCount: number;
};

const NAV_ITEMS = [
  { key: "home", href: "/", labelEn: "Home", labelAr: "الرئيسية" },
  { key: "market", href: "/gallery", labelEn: "Market", labelAr: "السوق" },
  { key: "rfq", href: "/rfq", labelEn: "RFQ", labelAr: "طلبات عروض" },
  { key: "tools", href: "/tools", labelEn: "Tools", labelAr: "الأدوات" },
  { key: "map", href: "/map", labelEn: "Map", labelAr: "الخريطة" },
] as const;

export function WebHeader({ hasUser, userId, userName, userAvatar, unreadMessageCount }: Props) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--bina-border)] bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-[var(--bina-primary)] py-2">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-white/80">
            B2B Wholesale Platform · 50,000+ Products
          </p>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <Link href="/help" className="hover:text-white">Help Center</Link>
            <Link href="/contact" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bina-display text-2xl font-black text-[var(--bina-primary)]">
              BINA<span className="text-[var(--bina-accent)]">Hub</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <SearchInput />
          </div>

          {/* User Nav */}
          <UserNav
            hasUser={hasUser}
            userId={userId}
            userName={userName}
            userAvatar={userAvatar}
            unreadMessageCount={unreadMessageCount}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-[var(--bina-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-[var(--bina-primary)]"
                    : "text-[var(--bina-muted)] hover:text-[var(--bina-text)]"
                }`}
              >
                {t(item.key)}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--bina-primary)]" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
