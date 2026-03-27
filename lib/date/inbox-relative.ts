/**
 * Short relative labels for inbox rows (Messenger-style), locale-aware via Intl.
 */
export function formatInboxRelativeTime(locale: string, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffSec < 45) {
    return rtf.format(-Math.max(0, diffSec), "second");
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return rtf.format(-diffMin, "minute");
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return rtf.format(-diffHr, "hour");
  }
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) {
    return rtf.format(-diffDay, "day");
  }

  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
