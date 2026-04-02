export const DESKTOP_CATEGORY_ICON_BUCKET = "homepage-desktop-category-icons";

/** Public URL for an object in the desktop category icons bucket. */
export function desktopCategoryIconPublicUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const enc = storagePath
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${base}/storage/v1/object/public/${DESKTOP_CATEGORY_ICON_BUCKET}/${enc}`;
}
