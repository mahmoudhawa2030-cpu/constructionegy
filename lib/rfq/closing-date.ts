/**
 * datetime-local values are "naive" (no TZ). Treat them as Africa/Cairo (Egypt, UTC+2).
 */
const EGYPT_OFFSET_HOURS = 2;

export function parseClosingDateLocalToIso(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  if ([y, mo, d, h, mi].some((n) => !Number.isFinite(n))) return null;
  const utcMs = Date.UTC(y, mo - 1, d, h - EGYPT_OFFSET_HOURS, mi, 0, 0);
  return new Date(utcMs).toISOString();
}

export function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const y = get("year");
  const mo = get("month");
  const da = get("day");
  const h = get("hour");
  const mi = get("minute");
  if (!y || !mo || !da || !h || !mi) return "";
  return `${y}-${mo}-${da}T${h}:${mi}`;
}
