/**
 * Admin user list: filter by presence / activity windows.
 * Thresholds live in `@/lib/presence/online` (shared with app UI).
 */
export type PresenceFilter =
  | "all"
  | "online"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "180d";

export {
  ONLINE_THRESHOLD_MS,
  ONLINE_WINDOW_MS,
  isUserOnlineNow,
  lastSeenOnlineSinceIso,
} from "@/lib/presence/online";

export function parsePresenceFilter(raw: string | undefined): PresenceFilter {
  const allowed: PresenceFilter[] = [
    "all",
    "online",
    "24h",
    "7d",
    "30d",
    "90d",
    "180d",
  ];
  if (raw && allowed.includes(raw as PresenceFilter)) {
    return raw as PresenceFilter;
  }
  return "all";
}

/** ISO timestamp: rows with last_active_at >= this match "active since". */
export function activeSinceIso(filter: PresenceFilter): string | null {
  if (filter === "all" || filter === "online") return null;
  const now = Date.now();
  const ms: Record<Exclude<PresenceFilter, "all" | "online">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "180d": 180 * 24 * 60 * 60 * 1000,
  };
  const delta = ms[filter];
  return new Date(now - delta).toISOString();
}
