"use client";

import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const PULL_THRESHOLD = 56;
const MAX_PULL = 88;

type Props = {
  children: ReactNode;
};

/**
 * Pull-down to refresh for the messages inbox on Capacitor Android only.
 * Refetches the server layout via `router.refresh()` (conversation list + unread).
 */
export function AndroidInboxPullRefresh({ children }: Props) {
  const router = useRouter();
  const t = useTranslations("messagesInbox");
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullRef = useRef(0);
  const armedRef = useRef(false);
  const refreshingRef = useRef(false);

  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [androidNative, setAndroidNative] = useState(false);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    setAndroidNative(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android");
  }, []);

  const runRefresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    setPullPx(0);
    pullRef.current = 0;
    router.refresh();
    window.setTimeout(() => {
      refreshingRef.current = false;
      setRefreshing(false);
    }, 750);
  }, [router]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!androidNative || refreshingRef.current) return;
    const el = e.currentTarget;
    if (el.scrollTop > 2) {
      armedRef.current = false;
      return;
    }
    armedRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!androidNative || !armedRef.current || refreshingRef.current) return;
    const el = e.currentTarget;
    if (el.scrollTop > 2) {
      pullRef.current = 0;
      setPullPx(0);
      armedRef.current = false;
      return;
    }
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 8) {
      const p = Math.min(dy * 0.42, MAX_PULL);
      pullRef.current = p;
      setPullPx(p);
    }
  };

  const onTouchEnd = () => {
    if (!androidNative) return;
    const wasArmed = armedRef.current;
    armedRef.current = false;
    const p = pullRef.current;
    pullRef.current = 0;
    if (!wasArmed || refreshingRef.current) {
      setPullPx(0);
      return;
    }
    if (p >= PULL_THRESHOLD * 0.85) {
      runRefresh();
    } else {
      setPullPx(0);
    }
  };

  const showHint = androidNative && (pullPx > 12 || refreshing);

  return (
    <div className="relative min-h-0 flex-1">
      {showHint ? (
        <div
          className="pointer-events-none absolute start-0 end-0 top-1 z-10 flex justify-center"
          role="status"
          aria-live="polite"
          aria-label={refreshing ? t("pullRefreshingAria") : t("pullToRefreshAria")}
        >
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:bg-zinc-800/95 dark:text-zinc-300">
            {refreshing ? t("pullRefreshing") : t("pullReleaseToRefresh")}
          </span>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className="min-h-0 h-full overflow-y-auto overscroll-y-contain pb-4 pt-1"
        style={{
          transform: pullPx > 0 && !refreshing ? `translateY(${pullPx * 0.35}px)` : undefined,
          transition: pullPx === 0 && !refreshing ? "transform 0.2s ease-out" : undefined,
        }}
        onTouchStart={androidNative ? onTouchStart : undefined}
        onTouchMove={androidNative ? onTouchMove : undefined}
        onTouchEnd={androidNative ? onTouchEnd : undefined}
        onTouchCancel={androidNative ? onTouchEnd : undefined}
      >
        {children}
      </div>
    </div>
  );
}
