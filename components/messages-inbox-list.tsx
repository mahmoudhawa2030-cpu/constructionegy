"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { InboxItem } from "@/lib/messages/inbox";

type Props = {
  items: InboxItem[];
};

export function MessagesInboxList({ items }: Props) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const href = `/messages/${item.chatId}`;
        const active = pathname === href;
        return (
          <li key={item.chatId}>
            <div
              className={`rounded-xl border p-3 transition-colors ${
                active
                  ? "border-zinc-900 bg-white shadow-sm dark:border-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              }`}
            >
              <Link className="block" href={href}>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.listingTitle}</p>
                {item.lastPreview ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.lastPreview}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-zinc-400">لا رسائل بعد</p>
                )}
              </Link>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                مع{" "}
                <Link
                  className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-950 dark:text-zinc-200 dark:decoration-zinc-500 dark:hover:text-zinc-50"
                  href={`/profile/${item.otherId}`}
                >
                  {item.otherName}
                </Link>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
