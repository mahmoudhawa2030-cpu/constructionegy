"use client";

import { useEffect } from "react";

import { trackMetaBrowserEvent } from "@/lib/meta/browser";
import { recordListingView } from "@/lib/listings/record-view";

const STRICT_DEDUP_MS = 600;

type Props = {
  listingId: string;
  skip?: boolean;
  title?: string;
  category?: string | null;
  price?: number | null;
  currency?: string | null;
};

export function ListingViewTracker({
  listingId,
  skip,
  title,
  category,
  price,
  currency,
}: Props) {
  useEffect(() => {
    const gate = `lv_meta_${listingId}`;
    const now = Date.now();
    let allowMeta = true;
    if (typeof sessionStorage !== "undefined") {
      const prev = sessionStorage.getItem(gate);
      if (prev && now - Number(prev) < 30_000) allowMeta = false;
      else sessionStorage.setItem(gate, String(now));
    }

    if (allowMeta) {
      trackMetaBrowserEvent("ViewContent", {
        customData: {
          content_ids: [listingId],
          content_type: "product",
          content_name: title || undefined,
          content_category: category || undefined,
          value: typeof price === "number" ? price : undefined,
          currency: currency || "EGP",
        },
      });
    }

    if (skip) return;

    const viewGate = `lv_gate_${listingId}`;
    if (typeof sessionStorage !== "undefined") {
      const prev = sessionStorage.getItem(viewGate);
      if (prev && now - Number(prev) < STRICT_DEDUP_MS) return;
      sessionStorage.setItem(viewGate, String(now));
    }

    void recordListingView(listingId);
  }, [listingId, skip, title, category, price, currency]);

  return null;
}