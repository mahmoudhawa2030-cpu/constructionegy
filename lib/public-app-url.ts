/**
 * Canonical origin for the deployed web app (no trailing slash).
 * Used for Supabase auth `redirect_to` (e.g. password recovery) so links match where the user submitted the form.
 * Matches the Capacitor fallback when no env is set on the server.
 */
export const DEFAULT_PUBLIC_APP_URL = "https://constructionegy.vercel.app";

function normalizeOrigin(raw: string | undefined | null): string | null {
  const t = raw?.trim().replace(/\/$/, "");
  return t && t.length > 0 ? t : null;
}

/**
 * Resolves the public site origin.
 *
 * **Browser:** Always uses `window.location.origin` so password-reset (and similar) emails point at the same
 * host the user is on (production, preview, or localhost). This avoids accidentally using
 * `NEXT_PUBLIC_APP_URL=http://localhost:3000` on Vercel, which previously forced localhost links for everyone.
 *
 * **Server:** `VERCEL_URL` (preview/production), then `NEXT_PUBLIC_APP_URL`, then {@link DEFAULT_PUBLIC_APP_URL}.
 */
export function getPublicAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }

  const vercel = normalizeOrigin(process.env.VERCEL_URL);
  if (vercel) {
    if (vercel.startsWith("http://") || vercel.startsWith("https://")) {
      return vercel;
    }
    return `https://${vercel}`;
  }

  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;

  return DEFAULT_PUBLIC_APP_URL;
}

/**
 * `redirect_to` for Supabase `resetPasswordForEmail`.
 * Points at `/auth/confirm` which uses `token_hash` + `verifyOtp` (no PKCE verifier required).
 * This works even when the user opens the email in a different browser or device.
 *
 * IMPORTANT – Supabase Dashboard → Authentication → Email Templates → Reset Password:
 * Set the link URL to:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password
 */
export function getPasswordRecoveryRedirectUrl(): string {
  const origin = getPublicAppOrigin();
  return `${origin}/auth/confirm?type=recovery&next=${encodeURIComponent("/update-password")}`;
}
