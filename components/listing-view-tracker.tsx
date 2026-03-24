"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { recordListingView } from "@/lib/listings/record-view";

/** Suppress duplicate effect runs from React Strict Mode (dev) within this window. */
const STRICT_DEDUP_MS = 600;

type Props = {
  listingId: string;
  /** When true, no RPC call (e.g. owner viewing own listing). */
  skip?: boolean;
};

export function ListingViewTracker({ listingId, skip }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (skip) return;

    const gate = `lv_gate_${listingId}`;
    const now = Date.now();
    if (typeof sessionStorage !== "undefined") {
      const prev = sessionStorage.getItem(gate);
      if (prev && now - Number(prev) < STRICT_DEDUP_MS) return;
      sessionStorage.setItem(gate, String(now));
    }

    void (async () => {
      const result = await recordListingView(listingId);
      if (result.ok && result.recorded) {
        router.refresh();
      }
    })();
  }, [listingId, skip, router]);

  return null;
}
