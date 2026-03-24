/**
 * Shared “online” rules: same heartbeat + threshold as PresenceHeartbeat and admin filters.
 */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

/** Grace for 90s heartbeat gaps and light clock skew (see admin presence copy). */
export const ONLINE_THRESHOLD_MS = ONLINE_WINDOW_MS + 90_000;

export function lastSeenOnlineSinceIso(): string {
  return new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
}

export function isUserOnlineNow(lastSeenIso: string | null | undefined): boolean {
  if (!lastSeenIso) return false;
  const t = new Date(lastSeenIso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= ONLINE_THRESHOLD_MS;
}
