export const DESKTOP_CATEGORY_ICON_BUCKET = "homepage-desktop-category-icons";

/**
 * Base URL for all public storage objects.
 * Set NEXT_PUBLIC_STORAGE_BASE_URL when self-hosting (MinIO / S3-compatible).
 * Defaults to Supabase storage derived from NEXT_PUBLIC_SUPABASE_URL.
 *
 * Migration: on Hetzner just set
 *   NEXT_PUBLIC_STORAGE_BASE_URL=https://storage.yourdomain.com
 * and all storage URLs across the app update automatically.
 */
export function getStorageBaseUrl(): string {
  const override = process.env.NEXT_PUBLIC_STORAGE_BASE_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return `${supabaseUrl}/storage/v1/object/public`;
}

/** Public URL for an object in the desktop category icons bucket. */
export function desktopCategoryIconPublicUrl(storagePath: string): string {
  const base = getStorageBaseUrl();
  const enc = storagePath
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${base}/${DESKTOP_CATEGORY_ICON_BUCKET}/${enc}`;
}
