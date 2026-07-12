import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";

import { applyMetaTemplate, getSiteSeoSettings } from "./site-settings";

export type PageMetaInput = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
  type?: "website" | "article";
};

export async function buildPageMetadata(input: PageMetaInput): Promise<Metadata> {
  const base = getSiteUrl();
  const siteSeo = await getSiteSeoSettings(base);
  const siteName = siteSeo.organizationSchema.name || "construction-egy";

  const renderedTitle = applyMetaTemplate(siteSeo.metaTitleTemplate, input.title, input.description, siteName);
  const renderedDescription = applyMetaTemplate(
    siteSeo.metaDescriptionTemplate,
    input.title,
    input.description,
    siteName,
  );

  const canonical = input.canonicalPath ? `${base}${input.canonicalPath}` : base;
  const images = input.image ? [{ url: input.image, alt: input.imageAlt ?? input.title }] : undefined;

  return {
    title: renderedTitle,
    description: renderedDescription.slice(0, 160),
    alternates: { canonical },
    robots: input.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? "website",
      title: renderedTitle,
      description: renderedDescription.slice(0, 160),
      url: canonical,
      siteName,
      images,
    },
    twitter: {
      card: input.image ? "summary_large_image" : "summary",
      title: renderedTitle,
      description: renderedDescription.slice(0, 160),
      images: input.image ? [input.image] : undefined,
    },
  };
}
