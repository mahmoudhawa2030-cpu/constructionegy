"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { recordPresence } from "@/lib/profile/presence-actions";

/** Heartbeat interval while the tab is visible. */
const INTERVAL_MS = 90_000;

/**
 * Runs when the browser has a Supabase session. Wrapped so missing/invalid
 * env never crashes the whole app (createClient throws if no public key).
 */
export function PresenceHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (e) {
      console.error(
        "[PresenceHeartbeat] Supabase is not configured. Check .env.local (NEXT_PUBLIC_SUPABASE_URL + key).",
        e,
      );
      return;
    }

    const clearTimer = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    function tick() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void recordPresence();
    }

    function applySession(session: Session | null) {
      clearTimer();
      if (!session) return;
      tick();
      intervalRef.current = setInterval(tick, INTERVAL_MS);
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      subscription.unsubscribe();
      clearTimer();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return null;
}
