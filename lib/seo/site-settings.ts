import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OrganizationSchema = {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  description?: string;
};

export type WebSiteSchema = {
  "@context": "https://schema.org";
  "@type": "WebSite";
  url: string;
  name: string;
  potentialAction?: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
};

export type SiteSeoSettings = {
  organizationSchema: OrganizationSchema;
  websiteSchema: WebSiteSchema;
  metaTitleTemplate: string;
  metaDescriptionTemplate: string;
  robotsTxt: string;
};

const KEYS = {
  organizationSchema: "site_organization_schema",
  websiteSchema: "site_website_schema",
  metaTitleTemplate: "site_meta_title_template",
  metaDescriptionTemplate: "site_meta_description_template",
  robotsTxt: "site_robots_txt",
} as const;

const DEFAULT_TITLE_TEMPLATE = "{title} | construction-egy";
const DEFAULT_DESCRIPTION_TEMPLATE = "{description}";
const DEFAULT_ROBOTS_TXT = `User-agent: *\nDisallow: /admin\nDisallow: /api\nDisallow: /login\nDisallow: /signup\nDisallow: /profile\nDisallow: /messages\nDisallow: /bookings\nDisallow: /favorites\nDisallow: /notifications\nDisallow: /auth\nDisallow: /protected\nDisallow: /account-suspended\n\nSitemap: {sitemapUrl}\nHost: {host}\n`;

export function defaultSiteSeoSettings(baseUrl: string, siteName = "construction-egy"): SiteSeoSettings {
  return {
    organizationSchema: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
    },
    websiteSchema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: baseUrl,
      name: siteName,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/gallery?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    metaTitleTemplate: DEFAULT_TITLE_TEMPLATE,
    metaDescriptionTemplate: DEFAULT_DESCRIPTION_TEMPLATE,
    robotsTxt: DEFAULT_ROBOTS_TXT.replaceAll("{sitemapUrl}", `${baseUrl}/sitemap.xml`).replaceAll("{host}", baseUrl),
  };
}

export async function getSiteSeoSettings(baseUrl: string, siteName = "construction-egy"): Promise<SiteSeoSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", Object.values(KEYS));

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
  const defaults = defaultSiteSeoSettings(baseUrl, siteName);

  const parse = <T,>(key: keyof typeof KEYS, fallback: T): T => {
    const raw = map[KEYS[key]]?.trim();
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  return {
    organizationSchema: parse("organizationSchema", defaults.organizationSchema),
    websiteSchema: parse("websiteSchema", defaults.websiteSchema),
    metaTitleTemplate: map[KEYS.metaTitleTemplate] || defaults.metaTitleTemplate,
    metaDescriptionTemplate: map[KEYS.metaDescriptionTemplate] || defaults.metaDescriptionTemplate,
    robotsTxt: map[KEYS.robotsTxt] || defaults.robotsTxt,
  };
}

export async function saveSiteSeoSettings(settings: SiteSeoSettings): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("app_settings").upsert(
    [
      { key: KEYS.organizationSchema, value: JSON.stringify(settings.organizationSchema) },
      { key: KEYS.websiteSchema, value: JSON.stringify(settings.websiteSchema) },
      { key: KEYS.metaTitleTemplate, value: settings.metaTitleTemplate },
      { key: KEYS.metaDescriptionTemplate, value: settings.metaDescriptionTemplate },
      { key: KEYS.robotsTxt, value: settings.robotsTxt },
    ],
    { onConflict: "key" },
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function renderMetaTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function applyMetaTemplate(
  template: string,
  title: string,
  description: string,
  siteName?: string,
): string {
  return renderMetaTemplate(template, {
    title: title.trim(),
    description: description.trim().slice(0, 160),
    siteName: siteName?.trim() || "construction-egy",
  });
}
