/**
 * Returns the canonical public base URL of the site (no trailing slash).
 * Override per environment with NEXT_PUBLIC_SITE_URL (e.g. your custom domain).
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = raw && raw.length > 0 ? raw : "https://souqelmemar.com";
  return base.replace(/\/$/, "");
}
