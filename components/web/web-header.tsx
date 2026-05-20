"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { SearchInput } from "./search-input";
import { UserNav } from "./user-nav";

type CategoryItem = { slug: string; label_ar: string };

type Props = {
  hasUser: boolean;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  unreadMessageCount: number;
  categories?: CategoryItem[];
};

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "market", href: "/gallery" },
  { key: "rfq", href: "/rfq" },
  { key: "tools", href: "/tools" },
  { key: "map", href: "/map" },
] as const;

function FlashIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function WebHeader({ hasUser, userId, userName, userAvatar, unreadMessageCount, categories = [] }: Props) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 shadow-sm">
      {/* 1 — Top info bar (red) */}
      <div className="bg-[var(--bina-primary)] py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-white/80">B2B Wholesale Platform · 50,000+ Products</p>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <Link href="/help" className="hover:text-white transition-colors">{tCommon("helpCenter")}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{tCommon("contactUs")}</Link>
          </div>
        </div>
      </div>

      {/* 2 — Main bar (white): logo + search + user nav */}
      <div className="bg-white border-b border-zinc-200">
        <div className="mx-auto flex h-[58px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="font-bina-display text-2xl font-black tracking-tight text-[var(--bina-primary)]">
              BINA<span className="text-[var(--bina-accent)]">Hub</span>
            </span>
          </Link>

          {/* Search — grows to fill space */}
          <div className="min-w-0 flex-1 max-w-2xl">
            <SearchInput />
          </div>

          {/* User nav */}
          <UserNav
            hasUser={hasUser}
            userId={userId}
            userName={userName}
            userAvatar={userAvatar}
            unreadMessageCount={unreadMessageCount}
          />
        </div>
      </div>

      {/* 3 — Nav links row (white) */}
      <nav className="bg-white border-b border-zinc-200" aria-label="Primary navigation">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-10 items-center gap-0">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-[var(--bina-primary)]"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t(item.key)}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--bina-primary)] rounded-t-sm" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 4 — Categories bar (dark maroon) */}
      <div className="bg-[#6b1010] overflow-x-auto scrollbar-hide">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-8 py-0">
          {/* Flash Deals pill */}
          <Link
            href="/gallery"
            className="flex shrink-0 items-center gap-1.5 rounded-sm bg-[#f5c518] px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-yellow-300 transition-colors my-1.5"
          >
            <FlashIcon />
            {tCommon("flashDeals")}
          </Link>

          {/* Divider */}
          <span aria-hidden className="mx-1 h-4 w-px bg-white/20 shrink-0" />

          {/* Category links from DB */}
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
              className="shrink-0 whitespace-nowrap px-3 py-2 text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors rounded-sm"
            >
              {cat.label_ar}
            </Link>
          ))}

          {/* Post RFQ shortcut */}
          <Link
            href="/rfq"
            className="ms-auto shrink-0 whitespace-nowrap px-3 py-2 text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors rounded-sm"
          >
            {tCommon("postRfq")}
          </Link>
        </div>
      </div>
    </header>
  );
}
