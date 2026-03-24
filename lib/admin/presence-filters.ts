/**
 * Admin user list: filter by presence / activity windows.
 * Keep thresholds in sync with PresenceHeartbeat + admin UI labels.
 */
export type PresenceFilter =
  | "all"
  | "online"
  | "24h"
  | "7d"
  | "30d"
  | "90d"
  | "180d";

/** Base window for “online” (UX label ~3 min). */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

/**
 * Single cutoff for both the SQL filter and the «متصل» badge.
 * Includes grace for: badge vs query mismatch, 90s heartbeat gaps, light clock skew.
 * (Previously the badge used +15s but the filter used 0s grace → wrong counts.)
 */
export const ONLINE_THRESHOLD_MS = ONLINE_WINDOW_MS + 90_000;

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

export function lastSeenOnlineSinceIso(): string {
  return new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
}

/** Same rule as «online» filter — keep in sync with lastSeenOnlineSinceIso(). */
export function isUserOnlineNow(lastSeenIso: string): boolean {
  const t = new Date(lastSeenIso).getTime();
  return Date.now() - t <= ONLINE_THRESHOLD_MS;
}
