/**
 * Shared JSON-LD builders (Rank Math–style structured data).
 * Keep page components thin; all schema shape lives here.
 */

export type BreadcrumbItem = {
  name: string;
  /** Absolute URL; omit for the current (last) crumb if desired. */
  url?: string;
};

export function buildBreadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export type ArticleJsonLdInput = {
  headline: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished: string;
  dateModified: string;
  articleSection?: string;
  keywords?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  inLanguage?: string;
  wordCount?: number;
};

export function buildArticleJsonLd(input: ArticleJsonLdInput) {
  const publisherName = input.publisherName || "construction-egy";
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    url: input.url,
    image: input.image ? [input.image] : undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    articleSection: input.articleSection,
    keywords: input.keywords || undefined,
    inLanguage: input.inLanguage,
    wordCount: input.wordCount && input.wordCount > 0 ? input.wordCount : undefined,
    author: {
      "@type": "Organization",
      name: input.authorName || publisherName,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      ...(input.publisherLogo
        ? { logo: { "@type": "ImageObject", url: input.publisherLogo } }
        : {}),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
  };
}

export type ProductJsonLdInput = {
  name: string;
  description: string;
  images?: string[] | null;
  category?: string;
  condition?: "new" | "used" | string | null;
  price: number;
  priceCurrency?: string;
  availability: "InStock" | "OutOfStock";
  url: string;
  sellerName?: string;
  sku?: string;
};

export function buildProductJsonLd(input: ProductJsonLdInput) {
  const condition =
    input.condition === "new"
      ? "https://schema.org/NewCondition"
      : input.condition
        ? "https://schema.org/UsedCondition"
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image:
      input.images && input.images.length > 0 ? input.images : undefined,
    category: input.category,
    sku: input.sku,
    itemCondition: condition,
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.priceCurrency || "EGP",
      availability:
        input.availability === "InStock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: input.url,
      ...(input.sellerName
        ? { seller: { "@type": "Person", name: input.sellerName } }
        : {}),
    },
  };
}

/** Safe script payload for JSON-LD (escapes `</script>`). */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
