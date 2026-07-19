"use client";

import { useEffect } from "react";

import { trackMetaBrowserEvent } from "@/lib/meta/browser";

export function MetaSearchTracker({ query }: { query: string }) {
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    trackMetaBrowserEvent("Search", {
      customData: { search_string: q, content_category: "listings" },
    });
  }, [query]);

  return null;
}