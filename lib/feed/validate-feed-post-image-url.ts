/** Confirms a public storage URL was uploaded under the signed-in user’s feed folder. */
export function isValidUploadedFeedPostImageUrl(
  imageUrl: string,
  userId: string,
  supabaseProjectUrl: string,
): boolean {
  const base = supabaseProjectUrl.replace(/\/$/, "");
  const prefix = `${base}/storage/v1/object/public/feed-post-images/`;
  if (!imageUrl.startsWith(prefix)) return false;
  const objectPath = imageUrl.slice(prefix.length);
  const expected = `${userId}/feed/`;
  return objectPath.startsWith(expected) && objectPath.length > expected.length;
}
