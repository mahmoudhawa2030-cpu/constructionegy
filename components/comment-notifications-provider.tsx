"use client";

import Link from "next/link";
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

import { createClient } from "@/lib/supabase/client";

type NotifRow = {
  id: string;
  type: "comment_on_post" | "reply_to_comment";
  actor_name: string;
  post_id: string;
  read: boolean;
  created_at: string;
};

type ToastState = { notif: NotifRow } | null;

type ContextValue = {
  unreadCount: number;
};

const CommentNotificationsContext = createContext<ContextValue>({ unreadCount: 0 });

export function useCommentNotifications() {
  return useContext(CommentNotificationsContext);
}

type Props = {
  userId: string;
  initialUnreadCount: number;
  children: ReactNode;
};

export function CommentNotificationsProvider({ userId, initialUnreadCount, children }: Props) {
  const t = useTranslations("commentNotifications");
  const supabase = useMemo(() => createClient(), []);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastId = useRef<string | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    await (supabase
      .from("comment_notifications" as never)
      .update({ read: true } as never)
      .eq("recipient_user_id", userId)
      .eq("read", false) as unknown as Promise<unknown>);
  }, [supabase, userId]);

  useEffect(() => {
    const channel = supabase
      .channel(`comment-notifs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comment_notifications",
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotifRow;
          if (lastToastId.current === row.id) return;
          lastToastId.current = row.id;

          setUnreadCount((n) => n + 1);

          setToast({ notif: row });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 6000);
        },
      )
      .subscribe();

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const ctxValue = useMemo(() => ({ unreadCount, markAllRead }), [unreadCount, markAllRead]);

  return (
    <CommentNotificationsContext.Provider value={ctxValue}>
      {children}
      {toast ? (
        <div
          className="fixed z-[101] w-[min(100%,22rem)] start-3 end-3 sm:start-auto sm:end-4"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
          role="status"
        >
          <div className="flex flex-col gap-2 rounded-2xl border border-[var(--bina-border)] bg-[var(--bina-steel2)] p-4 shadow-xl">
            <p className="font-bina-display text-sm font-semibold text-[var(--bina-text)]">
              {toast.notif.type === "reply_to_comment"
                ? t("replyToComment", { actor: toast.notif.actor_name })
                : t("commentOnPost", { actor: toast.notif.actor_name })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="font-bina-display rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--bina-muted)] hover:bg-[var(--bina-steel3)]"
                onClick={dismissToast}
              >
                {t("toastDismiss")}
              </button>
              <Link
                href={`/posts/${toast.notif.post_id}#comments`}
                className="font-bina-display rounded-lg bg-[var(--bina-or)] px-3 py-1.5 text-sm font-medium text-white"
                onClick={dismissToast}
              >
                {t("toastView")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </CommentNotificationsContext.Provider>
  );
}
