/** Egypt (Cairo). Use for display so times match Egypt regardless of device timezone. */
export const EGYPT_TIMEZONE = "Africa/Cairo";

export function formatEgyptTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: EGYPT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEgyptDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ar-EG", {
    timeZone: EGYPT_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  });
}
