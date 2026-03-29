"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { useMobileChromeMenu } from "@/components/mobile-chrome-menu-context";
import { useMessageNotifications } from "@/components/message-notifications-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  hasUser: boolean;
};

export function MobileChromeMenuDrawer({ hasUser }: Props) {
  const t = useTranslations("nav");
  const tHome = useTranslations("home");
  const { open, closeMenu } = useMobileChromeMenu();
  const { unreadTotal } = useMessageNotifications();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) closeMenu();
    };
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, [closeMenu]);

  if (!open) return null;

  const linkClass =
    "rounded-lg px-3 py-3 text-start text-base font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800";

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        aria-label={t("closeMenuBackdropAria")}
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={closeMenu}
        type="button"
      />
      <aside
        aria-label={t("menuTitle")}
        aria-modal="true"
        className="absolute start-0 top-0 flex h-full w-[min(20rem,88vw)] flex-col border-e border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        id="mobile-chrome-menu"
        role="dialog"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("menuTitle")}</h2>
          <button
            aria-label={t("closeMenuAria")}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={closeMenu}
            type="button"
          >
            <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
        </div>

        <nav aria-label={t("menuNavAria")} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!hasUser ? (
            <Link className={linkClass} href="/login" onClick={closeMenu} prefetch={true}>
              {tHome("login")}
            </Link>
          ) : null}
          {hasUser ? (
            <>
              <Link className={linkClass} href="/profile" onClick={closeMenu} prefetch={true}>
                {t("profile")}
              </Link>
              <Link
                className={linkClass}
                href="/profile#business-verification"
                onClick={closeMenu}
                prefetch={true}
              >
                {t("businessVerification")}
              </Link>
              <Link
                aria-label={unreadTotal > 0 ? t("messagesTabAriaWithUnread", { count: unreadTotal }) : t("messages")}
                className={`relative ${linkClass}`}
                href="/messages"
                onClick={closeMenu}
                prefetch={true}
              >
                {t("messages")}
                {unreadTotal > 0 ? (
                  <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                ) : null}
              </Link>
              <Link className={linkClass} href="/favorites" onClick={closeMenu} prefetch={true}>
                {t("favorites")}
              </Link>
            </>
          ) : null}

          <div className="mt-2 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("menuAppearance")}
            </p>
            <ThemeToggle compact />
          </div>

          <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {t("menuLanguage")}
            </p>
            <LocaleSwitcher className="w-full max-w-none" />
          </div>

          {hasUser ? (
            <div className="mt-auto border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <SignOutButton />
            </div>
          ) : null}
        </nav>
      </aside>
    </div>
  );
}
