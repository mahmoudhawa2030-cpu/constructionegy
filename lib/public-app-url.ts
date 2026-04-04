/**
 * Canonical origin for the deployed web app (no trailing slash).
 * Used for Supabase auth `redirect_to` so password-reset emails open production, not localhost.
 * Matches the Capacitor fallback when `NEXT_PUBLIC_APP_URL` is unset.
 */
export const DEFAULT_PUBLIC_APP_URL = "https://constructionegy.vercel.app";

/**
 * Prefer `NEXT_PUBLIC_APP_URL` (set on Vercel / `.env.local`), then the current browser origin.
 * In non-browser contexts without env, falls back to {@link DEFAULT_PUBLIC_APP_URL}.
 */
export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return DEFAULT_PUBLIC_APP_URL;
}
