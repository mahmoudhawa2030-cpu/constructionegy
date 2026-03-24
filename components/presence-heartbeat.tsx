"use client";

import { useEffect, useRef } from "react";

import { recordPresence } from "@/lib/profile/presence-actions";

/** Heartbeat interval while the tab is visible (logged-in shell only). */
const INTERVAL_MS = 90_000;

export function PresenceHeartbeat() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function tick() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void recordPresence();
    }

    tick();
    timerRef.current = setInterval(tick, INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
