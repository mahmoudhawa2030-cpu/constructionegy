/** Confirms a public storage URL points at this user’s `feed/` objects (handles encoded path segments). */
export function isValidUploadedFeedPostImageUrl(
  imageUrl: string,
  userId: string,
  supabaseProjectUrl: string,
): boolean {
  let u: URL;
  try {
    u = new URL(imageUrl.trim());
  } catch {
    return false;
  }
  let base: URL;
  try {
    base = new URL(supabaseProjectUrl.trim().replace(/\/$/, ""));
  } catch {
    return false;
  }
  // Host/protocol must match project URL (case-insensitive host; avoids stray www mismatches).
  if (u.protocol !== base.protocol) return false;
  if (u.hostname.toLowerCase() !== base.hostname.toLowerCase()) return false;

  let path: string;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    path = u.pathname;
  }

  const prefix = "/storage/v1/object/public/feed-post-images/";
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  const segments = rest.split("/").filter(Boolean);
  // {userId}/feed/{file...}
  if (segments.length < 3) return false;
  if (segments[1] !== "feed") return false;
  if (segments[0]!.toLowerCase() !== userId.toLowerCase()) return false;
  return segments[2]!.length > 0;
}
