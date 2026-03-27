"use client";

import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";

import { useSupabaseResumeNonce } from "@/lib/capacitor/use-supabase-resume-nonce";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type ToastState = {
  chatId: string;
  preview: string;
} | null;

type MessageNotificationsContextValue = {
  unreadTotal: number;
  dismissToast: () => void;
};

const MessageNotificationsContext = createContext<MessageNotificationsContextValue | null>(null);

export function useMessageNotifications() {
  const ctx = useContext(MessageNotificationsContext);
  return (
    ctx ?? {
      unreadTotal: 0,
      dismissToast: () => {},
    }
  );
}

function activeChatIdFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length !== 2 || parts[0] !== "messages") return null;
  const id = parts[1];
  return id || null;
}

type ProviderProps = {
  userId: string;
  initialUnreadTotal: number;
  children: ReactNode;
};

export function MessageNotificationsProvider({ userId, initialUnreadTotal, children }: ProviderProps) {
  const pathname = usePathname();
  const resumeNonce = useSupabaseResumeNonce();
  const pathnameRef = useRef(pathname);
  const t = useTranslations("messageNotifications");
  const [unreadTotal, setUnreadTotal] = useState(initialUnreadTotal);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef<{ chatId: string; at: number } | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    setUnreadTotal(initialUnreadTotal);
  }, [initialUnreadTotal]);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (Capacitor.isNativePlatform()) return;
    void Notification.requestPermission();
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`msg-notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.sender_id === userId) return;

          const activeChat = activeChatIdFromPath(pathnameRef.current);
          const viewingThisChat = activeChat === row.chat_id;
          if (!viewingThisChat) {
            setUnreadTotal((n) => n + 1);
          }

          if (viewingThisChat) return;

          const now = Date.now();
          const last = lastToastRef.current;
          if (last && last.chatId === row.chat_id && now - last.at < 1500) {
            return;
          }
          lastToastRef.current = { chatId: row.chat_id, at: now };

          const preview =
            row.content.length > 140 ? `${row.content.slice(0, 137)}…` : row.content;

          setToast({ chatId: row.chat_id, preview });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(t("notificationTitle"), {
                body: preview,
                tag: `chat-${row.chat_id}`,
              });
            } catch {
              /* ignore */
            }
          }
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
          if (wasUnread && nowRead) {
            setUnreadTotal((n) => Math.max(0, n - 1));
          }
        },
      )
      .subscribe();

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, t, resumeNonce]);

  const ctxValue = useMemo(
    () => ({ unreadTotal, dismissToast }),
    [unreadTotal, dismissToast],
  );

  return (
    <MessageNotificationsContext.Provider value={ctxValue}>
      {children}
      {toast ? (
        <div
          className="fixed z-[100] w-[min(100%,22rem)] max-w-lg start-3 end-3 sm:start-auto"
          style={{
            bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
          }}
          role="status"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("toastTitle")}</p>
            <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">{toast.preview}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                onClick={dismissToast}
              >
                {t("toastDismiss")}
              </button>
              <Link
                href={`/messages/${toast.chatId}`}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={dismissToast}
              >
                {t("toastOpen")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </MessageNotificationsContext.Provider>
  );
}
