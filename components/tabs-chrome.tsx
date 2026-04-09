"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileChromeMenuDrawer } from "@/components/mobile-chrome-menu-drawer";
import { MobileChromeMenuProvider, useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { MessageNotificationsProvider, useMessageNotifications } from "@/components/message-notifications-provider";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  hasUser: boolean;
  userId: string | null;
  initialUnreadMessageCount: number;
  children: React.ReactNode;
};

function TabsChromeShellInner({ hasUser, children }: { hasUser: boolean; children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tHome = useTranslations("home");
  const pathname = usePathname();
  const { openMenu } = useMobileChromeMenu();
  const { unreadTotal } = useMessageNotifications();
  /** Industry feed uses its own chrome (FeedTopbar); skip hamburger bar to match mobile mock. */
  const isMobileFeedHome = pathname === "/" || pathname === "";

  return (
    <div className="flex min-h-full flex-col">
      {!isMobileFeedHome ? (
        <header
          className="sticky top-0 z-40 flex w-full items-center justify-between gap-2 border-b border-[var(--bina-border)] bg-[var(--bina-steel2)] px-3 py-2 backdrop-blur-md md:hidden"
          style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
        >
          <button
            aria-label={t("openMenuAria")}
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-[var(--bina-text)] hover:bg-[var(--bina-steel3)]"
            onClick={openMenu}
            type="button"
          >
            <svg aria-hidden className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
          <span className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-[var(--bina-text)]">
            {tHome("title")}
          </span>
          <span aria-hidden className="inline-block h-10 w-10 shrink-0" />
        </header>
      ) : null}
      <header
        className="sticky top-0 z-40 hidden w-full items-center justify-between gap-2 border-b border-bina-border bg-bina-topbar/95 px-3 py-2 backdrop-blur-md md:flex"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <LocaleSwitcher />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {hasUser ? (
            <Link
              className="relative shrink-0 rounded-md px-2 py-1 text-sm font-medium text-bina-text hover:bg-bina-steel3 dark:hover:bg-bina-steel3"
              href="/messages"
              prefetch={true}
              aria-label={t("messagesLinkAria")}
            >
              {t("messages")}
              {unreadTotal > 0 ? (
                <span className="font-bina-display absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bina-or px-1 text-[10px] font-bold leading-none text-white">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              ) : null}
            </Link>
          ) : null}
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-bina-red hover:bg-bina-red/10"
              href="/favorites"
              prefetch={true}
            >
              {t("favorites")}
            </Link>
          ) : null}
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-bina-text hover:bg-bina-steel3"
              href="/profile#expert-verification"
              prefetch={true}
            >
              {t("expertVerification")}
            </Link>
          ) : null}
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-bina-text hover:bg-bina-steel3"
              href="/profile#business-verification"
              prefetch={true}
            >
              {t("businessVerification")}
            </Link>
          ) : null}
          {hasUser ? <SignOutButton compact /> : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-0 md:pt-0">
        {children}
      </div>
      <MobileTabBar homeHref="/" />
      <MobileChromeMenuDrawer hasUser={hasUser} />
    </div>
  );
}

function TabsChromeShell({ hasUser, children }: { hasUser: boolean; children: React.ReactNode }) {
  return (
    <MobileChromeMenuProvider>
      <TabsChromeShellInner hasUser={hasUser}>{children}</TabsChromeShellInner>
    </MobileChromeMenuProvider>
  );
}

export function TabsChrome({ hasUser, userId, initialUnreadMessageCount, children }: Props) {
  const shell = <TabsChromeShell hasUser={hasUser}>{children}</TabsChromeShell>;

  if (hasUser && userId) {
    return (
      <MessageNotificationsProvider userId={userId} initialUnreadTotal={initialUnreadMessageCount}>
        {shell}
      </MessageNotificationsProvider>
    );
  }

  return shell;
}
