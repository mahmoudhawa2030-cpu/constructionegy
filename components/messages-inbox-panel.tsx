"use client";

import { useTranslations } from "next-intl";

import { AndroidInboxPullRefresh } from "@/components/android-inbox-pull-refresh";
import { MessagesInboxList } from "@/components/messages-inbox-list";
import type { InboxItem } from "@/lib/messages/inbox";

type Props = {
  userId: string;
  error: string | null;
  items: InboxItem[];
};

export function MessagesInboxPanel({ userId, error, items }: Props) {
  const t = useTranslations("messagesInbox");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f0f2f5] dark:bg-zinc-950">
      <AndroidInboxPullRefresh>
        {error ? (
          <p className="px-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
        {!error && items.length === 0 ? (
          <div className="mx-3 mt-2 rounded-xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm leading-relaxed text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
            {t("empty")}
          </div>
        ) : null}
        {!error && items.length > 0 ? <MessagesInboxList userId={userId} items={items} /> : null}
      </AndroidInboxPullRefresh>
    </div>
  );
}
