"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function MessagesSplitLayout({ sidebar, children }: Props) {
  const pathname = usePathname();
  const isMessagesHome = pathname === "/messages";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col md:flex-row" dir="ltr">
      <aside
        className={cn(
          "flex min-h-0 w-full shrink-0 flex-col overflow-y-auto border-zinc-200 bg-zinc-50/80 md:w-[min(100%,400px)] md:border-e dark:border-zinc-800 dark:bg-zinc-900/40",
          isMessagesHome ? "flex" : "hidden md:flex",
        )}
      >
        {sidebar}
      </aside>
      <main
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950",
          isMessagesHome ? "hidden md:flex" : "flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}
