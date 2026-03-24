import { isUserOnlineNow } from "@/lib/presence/online";

type Props = {
  lastSeenAt: string | null;
  /** Smaller dot/text for dense layouts (e.g. listing card). */
  compact?: boolean;
};

/**
 * Green dot + «متصل الآن» when `last_seen_at` is within the shared online window
 * (same rule as admin and PresenceHeartbeat ~90s interval).
 */
export function UserPresenceBadge({ lastSeenAt, compact }: Props) {
  const online = isUserOnlineNow(lastSeenAt);

  const dotClass = compact ? "h-2 w-2" : "h-2.5 w-2.5";
  const textClass = compact ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${textClass} ${
        online ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
      }`}
      title={
        online
          ? "نشط في التطبيق مؤخراً (حوالي آخر ٤ دقائق)"
          : "غير متصل حالياً أو التطبيق مغلق"
      }
    >
      <span
        aria-hidden
        className={`shrink-0 rounded-full ${dotClass} ${
          online ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" : "bg-zinc-400 dark:bg-zinc-500"
        }`}
      />
      <span>{online ? "متصل الآن" : "غير متصل"}</span>
    </span>
  );
}
