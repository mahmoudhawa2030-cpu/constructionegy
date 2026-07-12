"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

import type { ResolvedNewsTicker } from "@/lib/news-ticker/types";

type Props = {
  ticker: ResolvedNewsTicker;
};

export function NewsTickerBar({ ticker }: Props) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const duration = Math.max(8, Math.min(120, ticker.speedSeconds || 28));
  // Duplicate lines for seamless loop
  const loop = [...ticker.lines, ...ticker.lines];

  return (
    <div
      className="news-ticker-bar relative z-30 w-full overflow-hidden border-b"
      dir={isRtl ? "rtl" : "ltr"}
      role="region"
      aria-label={ticker.label}
      style={{
        background: ticker.bgColor,
        borderColor: "rgba(255,255,255,0.08)",
        color: ticker.textColor,
      }}
    >
      <div className="flex w-full items-stretch">
        <div
          className="flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide"
          style={{ background: ticker.accentColor, color: "#fff" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white"
            aria-hidden
          />
          {ticker.label}
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden py-1.5">
          <div
            className="news-ticker-track flex w-max items-center gap-8 whitespace-nowrap will-change-transform"
            style={{
              animationDuration: `${duration}s`,
              animationDirection: isRtl ? "reverse" : "normal",
            }}
          >
            {loop.map((line, i) => {
              const content = (
                <span className="inline-flex items-center gap-2 text-[12.5px] font-medium">
                  <span
                    className="inline-block h-1 w-1 rounded-full opacity-70"
                    style={{ background: ticker.accentColor }}
                    aria-hidden
                  />
                  {line.text}
                </span>
              );
              if (line.href) {
                return (
                  <Link
                    key={`${line.id}-${i}`}
                    href={line.href}
                    className="hover:underline"
                    style={{ color: ticker.textColor }}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <span key={`${line.id}-${i}`} style={{ color: ticker.textColor }}>
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
