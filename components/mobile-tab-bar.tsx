"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

function useTabDefs(homeHref: string, t: ReturnType<typeof useTranslations>) {
  return [
    { href: homeHref, label: t("home") },
    { href: "/gallery", label: t("gallery") },
    { href: "/map", label: t("map") },
    { href: "/messages", label: t("messages") },
    { href: "/profile", label: t("profile") },
  ] as const;
}

type Props = {
  /** Landing for guests is `/`; signed-in users use `/users/myads` for “الرئيسية”. */
  homeHref?: string;
  /** Unread incoming messages (shown on Messages tab). */
  messageUnreadCount?: number;
};

export function MobileTabBar({ homeHref = "/", messageUnreadCount = 0 }: Props) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tabs = useTabDefs(homeHref, t);

  return (
    <nav
      aria-label={t("mainNavAria")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2">
        {tabs.map(({ href, label }) => {
          const active =
            href === homeHref
              ? pathname === homeHref
              : pathname === href || pathname.startsWith(`${href}/`);
          const showMsgBadge = href === "/messages" && messageUnreadCount > 0;
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                className={`relative flex min-h-[3rem] flex-col items-center justify-center rounded-xl px-1 py-1 text-center text-xs font-medium transition-colors ${
                  active
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                href={href}
                prefetch={true}
                aria-label={
                  showMsgBadge ? t("messagesTabAriaWithUnread", { count: messageUnreadCount }) : label
                }
              >
                <span className="truncate">{label}</span>
                {showMsgBadge ? (
                  <span className="absolute end-2 top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
