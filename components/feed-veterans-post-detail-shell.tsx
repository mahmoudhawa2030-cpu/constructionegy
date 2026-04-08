"use client";

import type { ReactNode } from "react";

import { FeedVeteransCornerBanner } from "@/components/feed-veterans-corner-banner";

export function FeedVeteransPostDetailShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-4 overflow-hidden rounded-[var(--bina-r)] border border-[var(--bina-gold)]"
      style={{ background: "linear-gradient(135deg,#1e1a0e,#242016)" }}
    >
      <FeedVeteransCornerBanner />
      <div className="px-3 pb-6 pt-4">{children}</div>
    </div>
  );
}
