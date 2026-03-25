"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

// Published listing detail: /listings/:id only (not /listings/new, not …/edit).
function isListingDetailPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts[0] === "listings" && parts[1] !== "new";
}

type Props = {
  hasUser: boolean;
  children: React.ReactNode;
};

export function TabsChrome({ hasUser, children }: Props) {
  const pathname = usePathname();
  const minimal = isListingDetailPath(pathname);

  if (minimal) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky top-0 z-40 flex w-full items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-3 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <ThemeToggle compact />
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {hasUser ? (
            <Link
              className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              href="/favorites"
              prefetch={true}
            >
              المفضلة
            </Link>
          ) : null}
          {hasUser ? <SignOutButton compact /> : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <MobileTabBar />
    </div>
  );
}
