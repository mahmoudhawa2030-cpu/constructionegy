import { useMemo } from "react";

export type SeoCheckStatus = "pass" | "warn" | "fail";

export type SeoCheck = {
  id: string;
  status: SeoCheckStatus;
  points: number;
  maxPoints: number;
};

export type SeoAnalysis = {
  score: number;
  wordCount: number;
  checks: SeoCheck[];
};

export type SeoAnalyzerInput = {
  /** Raw HTML content from the editor. */
  html: string;
  seedKeyword: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  /** Public origin used to distinguish internal vs external links. */
  siteUrl?: string;
};

function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return el.textContent ?? "";
  }
  return html.replace(/<[^>]*>/g, " ");
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function includesKeyword(haystack: string, keyword: string): boolean {
  if (!keyword.trim()) return false;
  return haystack.toLowerCase().includes(keyword.trim().toLowerCase());
}

/**
 * RankMath-style SEO analysis. Pure function wrapped in useMemo so it can run
 * on every keystroke without re-allocating.
 */
export function useSeoAnalyzer(input: SeoAnalyzerInput): SeoAnalysis {
  const { html, seedKeyword, metaTitle, metaDescription, slug, siteUrl } = input;

  return useMemo(() => {
    const text = stripHtml(html);
    const wordCount = countWords(text);
    const kw = seedKeyword.trim().toLowerCase();
    const first100 = text.split(/\s+/).slice(0, 100).join(" ");

    // Link analysis from raw HTML.
    const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1]);
    const host = siteUrl ? safeHost(siteUrl) : "";
    let internalLinks = 0;
    let externalLinks = 0;
    for (const href of hrefs) {
      if (href.startsWith("/") || (host && href.includes(host))) internalLinks += 1;
      else if (/^https?:\/\//i.test(href)) externalLinks += 1;
    }

    // Image alt analysis.
    const imgTags = Array.from(html.matchAll(/<img\b[^>]*>/gi)).map((m) => m[0]);
    const imagesMissingAlt = imgTags.filter(
      (tag) => !/\balt=["'][^"']+["']/i.test(tag),
    ).length;

    const checks: SeoCheck[] = [];
    const add = (id: string, status: SeoCheckStatus, max: number) =>
      checks.push({
        id,
        status,
        maxPoints: max,
        points: status === "pass" ? max : status === "warn" ? Math.round(max / 2) : 0,
      });

    // Word count >= 1500 (warn between 1000-1500).
    add(
      "wordCount",
      wordCount >= 1500 ? "pass" : wordCount >= 1000 ? "warn" : "fail",
      20,
    );
    // Keyword in first 100 words.
    add("keywordInIntro", includesKeyword(first100, kw) ? "pass" : "fail", 15);
    // Meta title: contains keyword and <= 60 chars.
    add(
      "metaTitle",
      includesKeyword(metaTitle, kw) && metaTitle.length > 0 && metaTitle.length <= 60
        ? "pass"
        : metaTitle.length > 0
          ? "warn"
          : "fail",
      15,
    );
    // Meta description: contains keyword and <= 160 chars.
    add(
      "metaDescription",
      includesKeyword(metaDescription, kw) &&
        metaDescription.length > 0 &&
        metaDescription.length <= 160
        ? "pass"
        : metaDescription.length > 0
          ? "warn"
          : "fail",
      15,
    );
    // At least 1 external link.
    add("externalLink", externalLinks >= 1 ? "pass" : "fail", 10);
    // At least 1 internal link.
    add("internalLink", internalLinks >= 1 ? "pass" : "fail", 10);
    // No images missing alt (pass if no images too).
    add("imageAlt", imagesMissingAlt === 0 ? "pass" : "fail", 10);
    // Slug contains keyword.
    add("slugKeyword", kw && includesKeyword(slug, kw.replace(/\s+/g, "-")) ? "pass" : "fail", 5);

    const score = checks.reduce((sum, c) => sum + c.points, 0);

    return { score, wordCount, checks };
  }, [html, seedKeyword, metaTitle, metaDescription, slug, siteUrl]);
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}
