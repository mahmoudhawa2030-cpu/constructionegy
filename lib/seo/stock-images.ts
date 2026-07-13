/**
 * Arabic → English image search + Openverse stock photos for SEO editor.
 * No API key required (Openverse + optional MyMemory translate).
 */

export type StockImageResult = {
  url: string;
  thumb: string;
  alt: string;
  credit: string;
  title?: string;
};

const AR_EN_MAP: Record<string, string> = {
  "ايجار سقالات": "scaffolding construction site",
  "إيجار سقالات": "scaffolding construction site",
  "تأجير سقالات": "scaffolding rental construction",
  "سقالات": "scaffolding construction",
  "طوب اسمنتي": "cement bricks construction",
  "طوب أسمنتي": "cement bricks construction",
  "طوب اسمنى": "cement bricks construction",
  "طوب": "bricks construction building",
  "حديد تسليح": "rebar steel reinforcement construction",
  "خرسانة": "concrete construction pour",
  "اسمنت": "cement construction materials",
  "أسمنت": "cement construction materials",
  "سيراميك": "ceramic tiles construction",
  "عزل مائي": "waterproofing construction building",
  "دهانات": "paint construction interior",
  "رافعة": "crane construction site",
  "مقاول": "construction contractor building site",
  "بناء": "building construction site",
  "تشطيب": "interior finishing construction",
  "كهرباء": "electrical wiring construction",
  "سباكة": "plumbing pipes construction",
};

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function normalizeAr(s: string): string {
  return s
    .normalize("NFKC")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

/** Map Arabic construction keywords to English search queries. */
export async function toEnglishImageQuery(input: string): Promise<string> {
  const raw = (input || "").trim() || "construction";
  if (!containsArabic(raw)) {
    return `${raw} construction`.replace(/\s+/g, " ").trim();
  }

  const n = normalizeAr(raw);
  if (AR_EN_MAP[raw] || AR_EN_MAP[n]) {
    return AR_EN_MAP[raw] || AR_EN_MAP[n];
  }

  for (const [ar, en] of Object.entries(AR_EN_MAP)) {
    if (n.includes(normalizeAr(ar)) || normalizeAr(ar).includes(n)) {
      return en;
    }
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(raw)}&langpair=ar|en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = (await res.json()) as {
        responseData?: { translatedText?: string };
      };
      const t = data.responseData?.translatedText?.trim();
      if (t && !containsArabic(t) && t.toLowerCase() !== raw.toLowerCase()) {
        return `${t} construction`.replace(/\s+/g, " ").trim();
      }
    }
  } catch {
    /* fall through */
  }

  return "construction building materials site";
}

type OpenverseHit = {
  url?: string;
  thumbnail?: string;
  title?: string;
  creator?: string;
  attribution?: string;
};

/** Search Openverse (CC images). Free, no API key. */
export async function searchOpenverseImages(
  englishQuery: string,
  count = 9,
): Promise<StockImageResult[]> {
  const q = (englishQuery || "construction").trim();
  const pageSize = Math.min(Math.max(count, 1), 20);
  const api = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${pageSize}&license_type=commercial`;

  const res = await fetch(api, {
    headers: {
      Accept: "application/json",
      "User-Agent": "construction-egy-seo-editor/1.0",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`Openverse ${res.status}`);
  }

  const data = (await res.json()) as { results?: OpenverseHit[] };
  const results = data.results ?? [];

  return results
    .filter((r) => r.url || r.thumbnail)
    .map((r, i) => {
      const url = r.url || r.thumbnail || "";
      const thumb = r.thumbnail || r.url || "";
      const credit = r.creator
        ? `${r.creator} (Openverse/CC)`
        : "Openverse (CC)";
      return {
        url,
        thumb,
        alt: r.title || q,
        credit,
        title: r.title,
      };
    })
    .slice(0, pageSize);
}

/** Full pipeline: any keyword (AR/EN) → relevant stock images. */
export async function searchStockImagesForKeyword(
  keyword: string,
  count = 9,
  altKeyword?: string,
): Promise<{ images: StockImageResult[]; englishQuery: string }> {
  const englishQuery = await toEnglishImageQuery(keyword);
  let images = await searchOpenverseImages(englishQuery, count);

  if (images.length < 3) {
    const fallback = await searchOpenverseImages(
      "construction building site materials",
      count,
    );
    images = [...images, ...fallback].slice(0, count);
  }

  const altBase = (altKeyword || keyword || englishQuery).trim();
  images = images.map((img, i) => ({
    ...img,
    alt:
      i === 0
        ? `${altBase} - ${img.title || "construction"}`.slice(0, 120)
        : img.alt.includes(altBase)
          ? img.alt
          : `${altBase} ${img.alt}`.slice(0, 120),
  }));

  return { images, englishQuery };
}
