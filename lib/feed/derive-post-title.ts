const TITLE_MAX = 200;

/**
 * Preview line for cards and DB `title` when the user only writes a body (no separate headline).
 */
export function deriveFeedPostTitle(body: string): string {
  const b = body.trim();
  if (!b) return "—";
  const firstLine = b.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim() ?? b;
  const head = firstLine.length > 0 ? firstLine : b;
  const t = head.slice(0, TITLE_MAX).trim();
  return t || b.slice(0, TITLE_MAX).trim() || "—";
}
