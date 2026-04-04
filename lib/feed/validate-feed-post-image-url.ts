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
  if (u.origin !== base.origin) return false;

  let path: string;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    path = u.pathname;
  }

  const prefix = "/storage/v1/object/public/feed-post-images/";
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  const expected = `${userId}/feed/`;
  return rest.startsWith(expected) && rest.length > expected.length;
}
