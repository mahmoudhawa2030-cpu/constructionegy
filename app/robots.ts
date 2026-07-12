import { getSiteSeoSettings, defaultSiteSeoSettings } from "@/lib/seo/site-settings";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function robots() {
  const base = getSiteUrl();
  const { robotsTxt } = await getSiteSeoSettings(base).catch(() => defaultSiteSeoSettings(base));

  return new Response(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
}
