"use client";

import { useEffect } from "react";

import { recordProfileView } from "@/lib/profile/record-view";

const STRICT_DEDUP_MS = 600;

type Props = {
  subjectId: string;
};

export function ProfileViewTracker({ subjectId }: Props) {
  useEffect(() => {
    const gate = `pv_gate_${subjectId}`;
    const now = Date.now();
    if (typeof sessionStorage !== "undefined") {
      const prev = sessionStorage.getItem(gate);
      if (prev && now - Number(prev) < STRICT_DEDUP_MS) return;
      sessionStorage.setItem(gate, String(now));
    }

    void recordProfileView(subjectId);
  }, [subjectId]);

  return null;
}
