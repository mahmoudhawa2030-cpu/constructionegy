/** Confirms a public storage URL points at this user’s `feed/` objects (handles encoded path segments). */
/** Validates a Supabase public URL for feed-post-images. Only checks path structure (userId/feed/...). */
export function isValidUploadedFeedPostImageUrl(
  imageUrl: string,
  userId: string,
): boolean {
  let u: URL;
  try {
    u = new URL(imageUrl.trim());
  } catch {
    return false;
  }

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

  if (segments.length < 3) return false;
  if (segments[1] !== "feed") return false;
  if (segments[0]!.toLowerCase() !== userId.toLowerCase()) return false;

  return segments[2]!.length > 0;
}
