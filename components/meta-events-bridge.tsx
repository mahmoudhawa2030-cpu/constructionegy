"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { trackMetaBrowserEvent } from "@/lib/meta/browser";

/**
 * Single owner of PageView: browser Pixel + CAPI with the same event_id.
 * Admin Pixel snippet must not also call fbq('track','PageView') — TrackingScripts strips it.
 */
function MetaPageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");
  const inflight = useRef(false);

  useEffect(() => {
    const qs = searchParams?.toString() ?? "";
    const key = `${pathname}?${qs}`;
    if (!pathname || key === lastKey.current || inflight.current) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    const fire = () => {
      if (cancelled) return;
      attempts += 1;
      const hasFbq = typeof window !== "undefined" && typeof window.fbq === "function";
      if (!hasFbq && attempts < maxAttempts) {
        window.setTimeout(fire, 50);
        return;
      }
      if (lastKey.current === key) return;
      lastKey.current = key;
      inflight.current = false;
      trackMetaBrowserEvent("PageView");
    };

    inflight.current = true;
    const t = window.setTimeout(fire, 80);

    return () => {
      cancelled = true;
      inflight.current = false;
      window.clearTimeout(t);
    };
  }, [pathname, searchParams]);

  return null;
}

export function MetaEventsBridge() {
  return (
    <Suspense fallback={null}>
      <MetaPageViewTrackerInner />
    </Suspense>
  );
}
