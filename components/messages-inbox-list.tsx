"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { InboxItem } from "@/lib/messages/inbox";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  userId: string;
  items: InboxItem[];
};

export function MessagesInboxList({ userId, items }: Props) {
  const pathname = usePathname();
  const t = useTranslations("messagesInbox");
  const [rows, setRows] = useState<InboxItem[]>(items);

  useEffect(() => {
    setRows(items);
  }, [items]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-unread:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.sender_id === userId) {
            setRows((prev) =>
              prev.map((it) =>
                it.chatId === row.chat_id ? { ...it, lastPreview: row.content } : it,
              ),
            );
            return;
          }
          setRows((prev) =>
            prev.map((it) =>
              it.chatId === row.chat_id
                ? { ...it, lastPreview: row.content, unreadCount: it.unreadCount + 1 }
                : it,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const oldRow = payload.old as Partial<MessageRow> | undefined;
          const newRow = payload.new as MessageRow;
          if (newRow.sender_id === userId) return;
          const wasUnread = oldRow?.read_at == null;
          const nowRead = newRow.read_at != null;
          if (!wasUnread || !nowRead) return;
          setRows((prev) =>
            prev.map((it) =>
              it.chatId === newRow.chat_id
                ? { ...it, unreadCount: Math.max(0, it.unreadCount - 1) }
                : it,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((item) => {
        const href = `/messages/${item.chatId}`;
        const active = pathname === href;
        const preview = item.lastPreview ? (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {item.lastPreview}
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-400">{t("noMessagesYet")}</p>
        );

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
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 font-medium text-zinc-900 dark:text-zinc-50">
                    {item.listingTitle}
                  </p>
                  {item.unreadCount > 0 ? (
                    <span
                      className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-center text-xs font-bold text-white"
                      aria-label={t("unreadBadgeAria", { count: item.unreadCount })}
                    >
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </span>
                  ) : null}
                </div>
                {preview}
              </Link>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {t("withUser")}{" "}
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
