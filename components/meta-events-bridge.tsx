"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { trackMetaBrowserEvent } from "@/lib/meta/browser";

/**
 * Sends PageView to Meta Pixel + Conversion API on route changes (shared event_id).
 * Pair with browser Pixel init in Admin → Tracking (you may remove the standalone
 * fbq('track','PageView') line to avoid a duplicate first hit without event_id).
 */
function MetaPageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    const qs = searchParams?.toString() ?? "";
    const key = `${pathname}?${qs}`;
    if (!pathname || key === lastKey.current) return;
    lastKey.current = key;

    // Let Pixel base code inject first on cold load
    const t = window.setTimeout(() => {
      trackMetaBrowserEvent("PageView");
    }, 50);

    return () => window.clearTimeout(t);
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
