"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { formatInboxRelativeTime } from "@/lib/date/inbox-relative";
import { useSupabaseResumeNonce } from "@/lib/capacitor/use-supabase-resume-nonce";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { InboxItem } from "@/lib/messages/inbox";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  userId: string;
  items: InboxItem[];
};

function sortInboxByRecent(list: InboxItem[]): InboxItem[] {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

/** Prefer the row with newer lastMessageAt so Realtime (in + out) is not overwritten by stale RSC layout data. */
function mergeInboxServerWithClient(server: InboxItem[], prev: InboxItem[]): InboxItem[] {
  if (prev.length === 0) return sortInboxByRecent(server);
  const serverById = new Map(server.map((r) => [r.chatId, r]));
  const prevById = new Map(prev.map((r) => [r.chatId, r]));
  const allIds = [...new Set([...serverById.keys(), ...prevById.keys()])];
  const merged: InboxItem[] = [];
  for (const id of allIds) {
    const s = serverById.get(id);
    const p = prevById.get(id);
    if (!s) {
      if (p) merged.push(p);
      continue;
    }
    if (!p) {
      merged.push(s);
      continue;
    }
    const sT = new Date(s.lastMessageAt).getTime();
    const pT = new Date(p.lastMessageAt).getTime();
    merged.push(pT > sT ? p : s);
  }
  return sortInboxByRecent(merged);
}

function avatarInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const first = [...t][0];
  return first ? first.toUpperCase() : "?";
}

export function MessagesInboxList({ userId, items }: Props) {
  const pathname = usePathname();
  const locale = useLocale();
  const resumeNonce = useSupabaseResumeNonce();
  const t = useTranslations("messagesInbox");
  const [rows, setRows] = useState<InboxItem[]>(() => sortInboxByRecent(items));

  const sortedItems = useMemo(() => sortInboxByRecent(items), [items]);

  useEffect(() => {
    setRows((prev) => mergeInboxServerWithClient(sortedItems, prev));
  }, [sortedItems]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox-unread:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          const at = row.created_at;
          setRows((prev) => {
            const hit = prev.some((it) => it.chatId === row.chat_id);
            if (!hit) return prev;

            let next: InboxItem[];
            if (row.sender_id === userId) {
              next = prev.map((it) =>
                it.chatId === row.chat_id
                  ? { ...it, lastPreview: row.content, lastMessageAt: at }
                  : it,
              );
            } else {
              next = prev.map((it) =>
                it.chatId === row.chat_id
                  ? {
                      ...it,
                      lastPreview: row.content,
                      lastMessageAt: at,
                      unreadCount: it.unreadCount + 1,
                    }
                  : it,
              );
            }
            return sortInboxByRecent(next);
          });
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
  }, [userId, resumeNonce]);

  return (
    <ul className="flex flex-col">
      {rows.map((item) => {
        const href = `/messages/${item.chatId}`;
        const active = pathname === href;
        const unread = item.unreadCount > 0;
        const timeLabel = formatInboxRelativeTime(locale, item.lastMessageAt);
        const preview = item.lastPreview ? (
          <p
            className={`mt-0.5 line-clamp-2 text-sm leading-snug ${
              unread
                ? "font-medium text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {item.lastPreview}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-zinc-400 dark:text-zinc-500">{t("noMessagesYet")}</p>
        );

        return (
          <li key={item.chatId} className="border-b border-zinc-200/90 last:border-b-0 dark:border-zinc-700/80">
            <Link
              href={href}
              className={[
                "flex gap-3 px-3 py-3 transition-colors sm:px-3.5",
                active
                  ? "bg-white dark:bg-zinc-800/90"
                  : "hover:bg-white/80 dark:hover:bg-zinc-800/50",
              ].join(" ")}
              aria-label={t("openChatAria", { name: item.otherName, listing: item.listingTitle })}
            >
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-semibold text-white shadow-sm dark:bg-emerald-700"
                aria-hidden
              >
                {avatarInitial(item.otherName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`min-w-0 truncate text-[15px] sm:text-base ${
                      unread ? "font-bold text-zinc-900 dark:text-zinc-50" : "font-semibold text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {item.otherName}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {unread ? (
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white dark:bg-emerald-500"
                        aria-label={t("unreadBadgeAria", { count: item.unreadCount })}
                      >
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    ) : null}
                    {timeLabel ? (
                      <time
                        className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500"
                        dateTime={item.lastMessageAt}
                      >
                        {timeLabel}
                      </time>
                    ) : null}
                  </div>
                </div>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.listingTitle}</p>
                {preview}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
