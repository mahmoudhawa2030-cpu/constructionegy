"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { sendMessage } from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type Props = {
  chatId: string;
  currentUserId: string;
  initialMessages: MessageRow[];
};

export function ChatThread({ chatId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
            return [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId]);

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
    setText("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        {messages.length === 0 ? (
          <li className="text-center text-sm text-zinc-500 dark:text-zinc-400">لا رسائل بعد. اكتب أدناه.</li>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
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
                  <p
                    className={`mt-1 text-[10px] opacity-70 ${mine ? "text-white/80" : "text-zinc-500"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            );
          })
        )}
        <div ref={bottomRef} />
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
