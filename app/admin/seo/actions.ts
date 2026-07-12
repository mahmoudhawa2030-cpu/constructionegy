"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/auth/admin";
import { saveSiteSeoSettings, type SiteSeoSettings } from "@/lib/seo/site-settings";

export type SeoSettingsActionState = { ok: true; message: string } | { ok: false; message: string };

export async function saveSiteSeoFromForm(
  _prev: SeoSettingsActionState | null,
  formData: FormData,
): Promise<SeoSettingsActionState> {
  await requireAdmin();
  const t = await getTranslations("adminSeoSettings");

  const baseUrl = String(formData.get("base_url") ?? "").trim();
  const siteName = String(formData.get("site_name") ?? "").trim() || "construction-egy";
  const logo = String(formData.get("logo") ?? "").trim() || undefined;
  const sameAs = String(formData.get("same_as") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const description = String(formData.get("description") ?? "").trim() || undefined;
  const searchTarget = String(formData.get("search_target") ?? "").trim() || `${baseUrl}/gallery?q={search_term_string}`;

  const titleTemplate = String(formData.get("title_template") ?? "").trim() || "{title} | {siteName}";
  const descriptionTemplate = String(formData.get("description_template") ?? "").trim() || "{description}";
  const robotsTxt = String(formData.get("robots_txt") ?? "").trim();

  if (!baseUrl) {
    return { ok: false, message: t("errorBaseUrl") };
  }

  const settings: SiteSeoSettings = {
    organizationSchema: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
      ...(logo ? { logo } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(description ? { description } : {}),
    },
    websiteSchema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: baseUrl,
      name: siteName,
      potentialAction: {
        "@type": "SearchAction",
        target: searchTarget,
        "query-input": "required name=search_term_string",
      },
    },
    metaTitleTemplate: titleTemplate,
    metaDescriptionTemplate: descriptionTemplate,
    robotsTxt: robotsTxt || `User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${baseUrl}/sitemap.xml\nHost: ${baseUrl}\n`,
  };

  const result = await saveSiteSeoSettings(settings);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  revalidatePath("/robots.txt");
  return { ok: true, message: t("saved") };
}
