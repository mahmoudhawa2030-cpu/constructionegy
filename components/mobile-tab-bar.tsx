"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { useIsMobileNav } from "@/lib/hooks/use-is-mobile-nav";

type TabItem =
  | { kind: "link"; href: string; label: string; aria?: string }
  | { kind: "verify"; href: string; label: string; aria: string }
  | { kind: "profile-menu"; href: "/profile"; label: string };

function useTabItems(
  homeHref: string,
  hasUser: boolean,
  t: ReturnType<typeof useTranslations<"nav">>,
): TabItem[] {
  const items: TabItem[] = [
    { kind: "link", href: homeHref, label: t("home") },
    { kind: "link", href: "/gallery", label: t("gallery") },
    { kind: "link", href: "/map", label: t("map") },
    { kind: "link", href: "/messages", label: t("messages") },
  ];
  if (hasUser) {
    items.push({
      kind: "verify",
      href: "/profile#business-verification",
      label: t("verificationTab"),
      aria: t("verificationTabAria"),
    });
  }
  items.push({ kind: "profile-menu", href: "/profile", label: t("profile") });
  return items;
}

type Props = {
  hasUser?: boolean;
  /** Landing for guests is `/`; signed-in users use `/users/myads` for “الرئيسية”. */
  homeHref?: string;
  /** Unread incoming messages (shown on Messages tab). */
  messageUnreadCount?: number;
};

export function MobileTabBar({
  hasUser = false,
  homeHref = "/",
  messageUnreadCount = 0,
}: Props) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tabs = useTabItems(homeHref, hasUser, t);
  const isMobile = useIsMobileNav();
  const { openMenu } = useMobileChromeMenu();
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <nav
      aria-label={t("mainNavAria")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 sm:px-2">
        {tabs.map((item) => {
          if (item.kind === "profile-menu") {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const profileOpensMenu = isMobile;

            if (profileOpensMenu) {
              return (
                <li key="profile-menu" className="min-w-0 flex-1">
                  <button
                    className={`relative flex min-h-[3rem] w-full flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                      active
                        ? "text-zinc-900 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                    type="button"
                    aria-label={item.label}
                    onClick={() => openMenu()}
                  >
                    <span className="line-clamp-2 break-words">{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key="profile-link" className="min-w-0 flex-1">
                <Link
                  className={`relative flex min-h-[3rem] flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                    active
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                  href={item.href}
                  prefetch={true}
                  aria-label={item.label}
                >
                  <span className="line-clamp-2 break-words">{item.label}</span>
                </Link>
              </li>
            );
          }

          const href = item.href;
          const showMsgBadge = href === "/messages" && messageUnreadCount > 0;
          const active =
            item.kind === "verify"
              ? pathname === "/profile" && hash === "#business-verification"
              : href === homeHref
                ? pathname === homeHref
                : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={`${item.kind}-${href}`} className="min-w-0 flex-1">
              <Link
                className={`relative flex min-h-[3rem] flex-col items-center justify-center rounded-xl px-0.5 py-1 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs ${
                  active
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                href={href}
                prefetch={true}
                aria-label={item.kind === "verify" ? item.aria : item.aria ?? item.label}
              >
                <span className="line-clamp-2 break-words">{item.label}</span>
                {showMsgBadge ? (
                  <span className="absolute end-1 top-0.5 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
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
