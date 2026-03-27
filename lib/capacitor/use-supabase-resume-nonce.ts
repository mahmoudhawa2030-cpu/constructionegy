"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

/**
 * Increments when the user returns to the tab/app after it was in the background.
 * Use as a dependency to recreate Supabase Realtime subscriptions (Android WebView
 * often drops the WebSocket while backgrounded).
 */
export function useSupabaseResumeNonce(): number {
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const bump = () => setNonce((n) => n + 1);

    let prevHidden = document.hidden;
    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      if (visible && prevHidden) bump();
      prevHidden = document.hidden;
    };

    document.addEventListener("visibilitychange", onVisibility);

    let appListener: { remove: () => Promise<void> } | undefined;
    let seenInactive = false;

    void (async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const { App } = await import("@capacitor/app");
        appListener = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) seenInactive = true;
          if (isActive && seenInactive) bump();
        });
      } catch {
        /* optional native plugin */
      }
    })();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void appListener?.remove();
    };
  }, []);

  return nonce;
}
