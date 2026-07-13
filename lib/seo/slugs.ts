/**
 * Top-level path segments that must never be used as a category slug, because
 * they collide with existing static routes. Used to guard the root-level
 * dynamic `[categorySlug]` route.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "gallery",
  "web",
  "login",
  "signup",
  "logout",
  "profile",
  "profiles",
  "listings",
  "listing",
  "messages",
  "admin",
  "api",
  "auth",
  "pricing",
  "protected",
  "account-suspended",
  "notifications",
  "bookings",
  "favorites",
  "blog",
  "articles",
  "sitemap.xml",
  "robots.txt",
  "manifest.json",
  "favicon.ico",
  "_next",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

/** Convert arbitrary text to a URL-safe post slug (hyphenated; Latin + Arabic + digits). */
export function slugify(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    // Keep letters (incl. Arabic) and numbers; collapse everything else to "-"
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * ASCII-only object key for Supabase Storage.
 * Storage rejects non-ASCII keys (e.g. Arabic) with "Invalid key".
 * Safe for file paths; not for public URL slugs (use slugify for those).
 */
export function storageObjectBase(input: string, fallback = "image"): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return ascii || fallback;
}

/** Random alphanumeric suffix for unique file names. */
export function randomSuffix(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
