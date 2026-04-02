"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { MobileChromeMenuDrawer } from "@/components/mobile-chrome-menu-drawer";
import { MobileChromeMenuProvider } from "@/components/mobile-chrome-menu-context";
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
  const { unreadTotal } = useMessageNotifications();

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 z-40 hidden w-full items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95 md:flex"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle compact />
          <LocaleSwitcher />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {hasUser ? (
            <Link
              className="relative shrink-0 rounded-md px-2 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              href="/messages"
              prefetch={true}
              aria-label={t("messagesLinkAria")}
            >
              {t("messages")}
              {unreadTotal > 0 ? (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              ) : null}
            </Link>
          ) : null}
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              href="/favorites"
              prefetch={true}
            >
              {t("favorites")}
            </Link>
          ) : null}
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              href="/profile#business-verification"
              prefetch={true}
            >
              {t("businessVerification")}
            </Link>
          ) : null}
          {hasUser ? <SignOutButton compact /> : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-[max(0px,env(safe-area-inset-top))] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-0">
        {children}
      </div>
      <MobileTabBar
        hasUser={hasUser}
        homeHref="/"
        messageUnreadCount={unreadTotal}
      />
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
