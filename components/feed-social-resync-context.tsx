"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

export type FeedSocialResyncContextValue = {
  /** Increments on each pull-to-refresh so the feed can refetch social stats. */
  generation: number;
  bump: () => void;
};

export const FeedSocialResyncContext = createContext<FeedSocialResyncContextValue | null>(null);

export function FeedSocialResyncProvider({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const bump = useCallback(() => {
    setGeneration((g) => g + 1);
  }, []);
  const value = useMemo(() => ({ generation, bump }), [generation, bump]);
  return <FeedSocialResyncContext.Provider value={value}>{children}</FeedSocialResyncContext.Provider>;
}
