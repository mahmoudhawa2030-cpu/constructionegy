"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMessageNotifications } from "@/components/message-notifications-provider";

type Category = {
  slug: string;
  label_ar: string;
  label_en?: string | null;
};

export function WebHeader({ categories }: { categories: Category[] }) {
  const t = useTranslations("nav");
  const { unreadTotal } = useMessageNotifications();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      {/* Top bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--bina-primary)]">
              BINA<span className="text-[var(--bina-accent)]">Hub</span>
            </span>
          </Link>

          {/* Search bar - hidden on mobile */}
          <div className="hidden flex-1 px-8 md:block">
            <Link
              href="/gallery"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search products, suppliers...
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link href="/messages" className="relative text-gray-600 hover:text-[var(--bina-primary)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {unreadTotal > 0 ? (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--bina-primary)] text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              ) : null}
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-[var(--bina-primary)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            <Link
              href="/rfq/new"
              className="hidden rounded-lg bg-[var(--bina-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a81f1f] sm:block"
            >
              Request Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 overflow-x-auto py-3 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/gallery" className="whitespace-nowrap font-semibold text-[var(--bina-primary)] hover:underline">
              All Categories
            </Link>
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.slug}
                href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
                className="whitespace-nowrap text-gray-600 hover:text-[var(--bina-primary)]"
              >
                {cat.label_ar}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
