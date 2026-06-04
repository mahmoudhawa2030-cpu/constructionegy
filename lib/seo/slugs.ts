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

/** Convert arbitrary text to a URL-safe post slug (hyphenated, ascii). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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
