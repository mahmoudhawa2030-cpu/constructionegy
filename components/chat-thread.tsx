"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MessageDeliveryTicks, messageReceiptStatus } from "@/components/message-delivery-ticks";
import { markConversationSeen, sendMessage } from "@/lib/chat/actions";
import { formatEgyptTime } from "@/lib/date/egypt";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  chatId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
};

function sortNewestFirst(rows: MessageRow[]): MessageRow[] {
  return [...rows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function ChatThread({ chatId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(() => sortNewestFirst(initialMessages));
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const markSeenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToNewest = useCallback(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToNewest();
  }, [messages.length, scrollToNewest]);

  const scheduleMarkSeen = useCallback(() => {
    if (markSeenTimer.current) clearTimeout(markSeenTimer.current);
    markSeenTimer.current = setTimeout(() => {
      void markConversationSeen(chatId);
    }, 400);
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
    const supabase = createClient();
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
            return sortNewestFirst([...prev, row]);
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
  }, [chatId, currentUserId, scheduleMarkSeen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    const result = await sendMessage(chatId, trimmed);
    setSending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === result.message.id)) return prev;
      return sortNewestFirst([...prev, result.message]);
    });
    setText("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ul
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        {messages.length === 0 ? (
          <li className="text-center text-sm text-zinc-500 dark:text-zinc-400">لا رسائل بعد. اكتب أدناه.</li>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const receipt = mine ? messageReceiptStatus(m) : null;
            return (
              <li
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    mine
                      ? "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "rounded-bl-md bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                      mine ? "text-white/80 dark:text-zinc-600" : "text-zinc-500"
                    }`}
                  >
                    <time dateTime={m.created_at}>{formatEgyptTime(m.created_at)}</time>
                    {mine && receipt ? <MessageDeliveryTicks status={receipt} /> : null}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            maxLength={5000}
            placeholder="اكتب رسالتك…"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="shrink-0 self-end rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            disabled={sending || !text.trim()}
            type="submit"
          >
            {sending ? "…" : "إرسال"}
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
