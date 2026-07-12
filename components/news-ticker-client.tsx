"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { NewsTickerBar } from "@/components/news-ticker-bar";
import type { ResolvedNewsTicker } from "@/lib/news-ticker/types";

type Props = {
  surface: "web" | "mobile";
};

export function NewsTickerClient({ surface }: Props) {
  const pathname = usePathname() || "/";
  const locale = useLocale();
  const [ticker, setTicker] = useState<ResolvedNewsTicker | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = new URLSearchParams({
      surface,
      pathname,
      locale: locale === "ar" ? "ar" : "en",
    });
    fetch(`/api/news-ticker?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ResolvedNewsTicker | null) => {
        if (!cancelled) setTicker(data);
      })
      .catch(() => {
        if (!cancelled) setTicker(null);
      });
    return () => {
      cancelled = true;
    };
  }, [surface, pathname, locale]);

  if (!ticker) return null;
  return <NewsTickerBar ticker={ticker} />;
}
