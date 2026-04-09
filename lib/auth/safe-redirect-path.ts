/**
 * Prevents open redirects: only same-origin relative paths are allowed.
 */
export function safeAuthNextPath(raw: string | null | undefined, fallback: string): string {
  const v = raw?.trim() ?? "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("://") || v.includes("\n") || v.includes("\r")) {
    return fallback;
  }
  return v;
}
