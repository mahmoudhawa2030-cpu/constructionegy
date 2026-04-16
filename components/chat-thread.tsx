"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { MessageDeliveryTicks, messageReceiptStatus } from "@/components/message-delivery-ticks";
import { useSupabaseResumeNonce } from "@/lib/capacitor/use-supabase-resume-nonce";
import { markConversationSeenWithClient } from "@/lib/chat/mark-conversation-seen-core";
import { formatEgyptTime } from "@/lib/date/egypt";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  chatId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
};

function sortOldestFirst(rows: MessageRow[]): MessageRow[] {
  return [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

function bubbleRadius(mine: boolean, isLastInGroup: boolean): string {
  const tail = mine ? "rounded-br-[5px]" : "rounded-bl-[5px]";
  return isLastInGroup ? `rounded-[18px] ${tail}` : "rounded-[18px] rounded-b-[6px]";
}

export function ChatThread({ chatId, currentUserId, initialMessages }: Props) {
  const resumeNonce = useSupabaseResumeNonce();
  const t = useTranslations("chatThread");
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<MessageRow[]>(() => sortOldestFirst(initialMessages));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLLIElement>(null);
  const markSeenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const scheduleMarkSeen = useCallback(() => {
    if (markSeenTimer.current) clearTimeout(markSeenTimer.current);
    markSeenTimer.current = setTimeout(() => {
      void markConversationSeenWithClient(supabase, chatId);
    }, 400);
  }, [supabase, chatId]);

  /** On native: clear any delivered push notifications in the status bar when this chat opens. */
  useEffect(() => {
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { PushNotifications } = await import("@capacitor/push-notifications");
        await PushNotifications.removeAllDeliveredNotifications();
      } catch {
        /* plugin unavailable */
      }
    })();
  }, [chatId]);

  useEffect(() => {
    scheduleMarkSeen();
    const onVis = () => {
      if (document.visibilityState === "visible") scheduleMarkSeen();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (markSeenTimer.current) clearTimeout(markSeenTimer.current);
    };
  }, [chatId, scheduleMarkSeen, messages.length]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return sortOldestFirst([...prev, row]);
          });
          if (row.sender_id !== currentUserId) {
            scheduleMarkSeen();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) =>
            prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, currentUserId, scheduleMarkSeen, resumeNonce]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t("errors.emptyMessage"));
      return;
    }
    if (trimmed.length > 5000) {
      setError(t("errors.tooLong"));
      return;
    }
    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError(t("errors.loginRequired"));
        return;
      }
      const { data: row, error: insertError } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: trimmed,
        })
        .select()
        .single();

      if (insertError || !row) {
        setError(t("errors.sendFailed"));
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return sortOldestFirst([...prev, row]);
      });
      setText("");
    } catch {
      setError(t("errors.unknown"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        LTR physics: “mine” stays on the right and “theirs” on the left (Messenger/WhatsApp),
        regardless of page dir. Bubble text uses dir="auto" for Arabic/English.
      */}
      <ul
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#e8e3dc] px-2 pt-2 sm:rounded-b-xl sm:px-3 dark:bg-zinc-900"
        dir="ltr"
      >
        {messages.length === 0 ? (
          <li className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">{t("emptyList")}</li>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            const receipt = mine ? messageReceiptStatus(m) : null;
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const isFirstInGroup = !prev || prev.sender_id !== m.sender_id;
            const isLastInGroup = !next || next.sender_id !== m.sender_id;
            return (
              <li
                key={m.id}
                className={[
                  "flex w-full",
                  mine ? "justify-end" : "justify-start",
                  isFirstInGroup && i > 0 ? "mt-2.5" : "",
                  !isFirstInGroup ? "mt-0.5" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  className={[
                    "max-w-[min(85%,20rem)] px-3 py-1.5 text-[15px] leading-snug sm:text-sm",
                    bubbleRadius(mine, isLastInGroup),
                    mine
                      ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-700"
                      : "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100",
                  ].join(" ")}
                >
                  <p className="whitespace-pre-wrap break-words" dir="auto">
                    {m.content}
                  </p>
                  <div
                    className={[
                      "mt-0.5 flex items-center gap-1.5 text-[11px] tabular-nums",
                      mine ? "justify-end text-emerald-50/90" : "justify-start text-zinc-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    <time dateTime={m.created_at}>{formatEgyptTime(m.created_at)}</time>
                    {mine && receipt ? <MessageDeliveryTicks status={receipt} /> : null}
                  </div>
                </div>
              </li>
            );
          })
        )}
        <li ref={bottomRef} className="h-2 shrink-0 list-none" aria-hidden />
      </ul>

      <form
        className="shrink-0 border-t border-zinc-300/50 bg-white px-2 pb-1 pt-2 dark:border-zinc-700/50 dark:bg-zinc-950 sm:rounded-b-xl sm:px-3 sm:pb-2"
        onSubmit={handleSubmit}
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[1.35rem] border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
            maxLength={5000}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            disabled={sending || !text.trim()}
            type="submit"
            aria-label={sending ? t("sending") : t("send")}
          >
            {sending ? (
              <span
                className="inline-block size-5 animate-spin rounded-full border-2 border-emerald-50 border-t-transparent"
                aria-hidden
              />
            ) : (
              <svg className="h-5 w-5 -translate-x-px" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
