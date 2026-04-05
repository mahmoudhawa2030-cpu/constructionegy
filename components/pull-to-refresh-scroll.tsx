"use client";

import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { FeedSocialResyncContext } from "@/components/feed-social-resync-context";

const PULL_THRESHOLD = 56;
const MAX_PULL = 88;

export type PullToRefreshNamespace = "feed" | "messagesInbox";

type PlatformScope = "androidNative" | "mobileTouch";

type Props = {
  children: ReactNode;
  /** next-intl namespace: pullToRefreshAria, pullRefreshingAria, pullReleaseToRefresh, pullRefreshing */
  namespace: PullToRefreshNamespace;
  /** androidNative: Capacitor Android only (messages inbox). mobileTouch: native apps or narrow viewport + touch. */
  platformScope: PlatformScope;
};

function usePullEnabled(scope: PlatformScope): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const update = () => {
      if (scope === "androidNative") {
        setEnabled(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android");
        return;
      }
      if (Capacitor.isNativePlatform()) {
        setEnabled(true);
        return;
      }
      const mq = window.matchMedia("(max-width: 767.98px)");
      const touch =
        "ontouchstart" in window ||
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
      setEnabled(mq.matches && touch);
    };

    update();
    if (scope !== "mobileTouch") return;
    const mq = window.matchMedia("(max-width: 767.98px)");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [scope]);

  return enabled;
}

/**
 * Scroll container with pull-down → `router.refresh()` for RSC data (feed, inbox, etc.).
 */
export function PullToRefreshScroll({ children, namespace, platformScope }: Props) {
  const router = useRouter();
  const t = useTranslations(namespace);
  const enabled = usePullEnabled(platformScope);
  const feedSocialResync = useContext(FeedSocialResyncContext);

  const startYRef = useRef(0);
  const pullRef = useRef(0);
  const armedRef = useRef(false);
  const refreshingRef = useRef(false);

  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const runRefresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    setPullPx(0);
    pullRef.current = 0;
    router.refresh();
    // RSC refresh alone often keeps client social state; bump so feed refetches counts from API.
    feedSocialResync?.bump();
    window.setTimeout(() => {
      refreshingRef.current = false;
      setRefreshing(false);
    }, 750);
  }, [router, feedSocialResync]);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshingRef.current) return;
    const el = e.currentTarget;
    if (el.scrollTop > 2) {
      armedRef.current = false;
      return;
    }
    armedRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!enabled || !armedRef.current || refreshingRef.current) return;
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
    if (!enabled) return;
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

  const showHint = enabled && (pullPx > 12 || refreshing);

  return (
    <div className="relative min-h-0 flex-1">
      {showHint ? (
        <div
          aria-label={refreshing ? t("pullRefreshingAria") : t("pullToRefreshAria")}
          aria-live="polite"
          className="pointer-events-none absolute start-0 end-0 top-1 z-10 flex justify-center"
          role="status"
        >
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm dark:bg-zinc-800/95 dark:text-zinc-300">
            {refreshing ? t("pullRefreshing") : t("pullReleaseToRefresh")}
          </span>
        </div>
      ) : null}
      <div
        className="min-h-0 h-full overflow-y-auto overscroll-y-contain pb-4 pt-1"
        style={{
          WebkitOverflowScrolling: "touch",
          transform: pullPx > 0 && !refreshing ? `translateY(${pullPx * 0.35}px)` : undefined,
          transition: pullPx === 0 && !refreshing ? "transform 0.2s ease-out" : undefined,
        }}
        onTouchCancel={enabled ? onTouchEnd : undefined}
        onTouchEnd={enabled ? onTouchEnd : undefined}
        onTouchMove={enabled ? onTouchMove : undefined}
        onTouchStart={enabled ? onTouchStart : undefined}
      >
        {children}
      </div>
    </div>
  );
}
