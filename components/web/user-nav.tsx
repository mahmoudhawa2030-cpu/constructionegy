"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  hasUser: boolean;
  userId: string | null;
  userName: string | null;
  userAvatar: string | null;
  unreadMessageCount: number;
};

export function UserNav({ hasUser, userId, userName, userAvatar, unreadMessageCount }: Props) {
  const t = useTranslations("nav");
  const [showDropdown, setShowDropdown] = useState(false);

  if (!hasUser) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--bina-text)] hover:text-[var(--bina-primary)]"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-[var(--bina-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--bina-primary-dark)]"
        >
          {t("joinFree")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Messages */}
      <Link href="/messages" className="relative p-2 text-[var(--bina-muted)] hover:text-[var(--bina-text)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {unreadMessageCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bina-primary)] text-[10px] font-bold text-white">
            {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
          </span>
        )}
      </Link>

      {/* Favorites */}
      <Link href="/favorites" className="p-2 text-[var(--bina-muted)] hover:text-[var(--bina-text)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </Link>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--bina-steel)]"
        >
          {userAvatar ? (
            <img src={userAvatar} alt={userName ?? ""} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bina-primary)] text-sm font-medium text-white">
              {userName?.charAt(0).toUpperCase() ?? "U"}
            </div>
          )}
          <span className="hidden text-sm font-medium text-[var(--bina-text)] md:block">
            {userName ?? t("myAccount")}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--bina-muted)]">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[var(--bina-border)] bg-white py-2 shadow-lg">
            <Link href="/profile" className="block px-4 py-2 text-sm text-[var(--bina-text)] hover:bg-[var(--bina-steel)]">
              {t("profile")}
            </Link>
            <Link href="/listings" className="block px-4 py-2 text-sm text-[var(--bina-text)] hover:bg-[var(--bina-steel)]">
              {t("myListings")}
            </Link>
            <Link href="/bookings" className="block px-4 py-2 text-sm text-[var(--bina-text)] hover:bg-[var(--bina-steel)]">
              {t("bookings")}
            </Link>
            <hr className="my-2 border-[var(--bina-border)]" />
            <form action="/auth/signout" method="post">
              <button type="submit" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-[var(--bina-steel)]">
                {t("signOut")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
