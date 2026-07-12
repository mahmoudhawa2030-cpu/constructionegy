import type { Database } from "@/lib/supabase/database.types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export type ListingScoreBreakdown = {
  title: number;
  description: number;
  images: number;
  price: number;
  location: number;
  category: number;
  condition: number;
  status: number;
  total: number;
};

export type ListingScore = {
  score: number;
  max: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: ListingScoreBreakdown;
  suggestions: string[];
};

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

function gradeFromPercentage(pct: number): ListingScore["grade"] {
  if (pct >= 90) return "A";
  if (pct >= 75) return "B";
  if (pct >= 55) return "C";
  if (pct >= 35) return "D";
  return "F";
}

export function scoreListing(listing: Listing, locale: "ar" | "en" = "en"): ListingScore {
  const suggestions: string[] = [];
  const t = (key: string) => key; // fallback; UI will translate separately

  // Title: 15 pts. Ideal 30-60 chars.
  const titleLen = listing.title?.length ?? 0;
  let titleScore = 0;
  if (titleLen === 0) {
    suggestions.push(locale === "ar" ? "أضف عنواناً واضحاً." : "Add a clear title.");
  } else if (titleLen < 20) {
    titleScore = 5;
    suggestions.push(locale === "ar" ? "العنوان قصير جداً (30–60 حرفاً مثالية)." : "Title is too short (30–60 characters ideal).");
  } else if (titleLen <= 70) {
    titleScore = 15;
  } else {
    titleScore = 10;
    suggestions.push(locale === "ar" ? "العنوان طويل جداً (30–60 حرفاً مثالية)." : "Title is too long (30–60 characters ideal).");
  }

  // Description: 20 pts. Ideal 100-500 chars.
  const descLen = listing.description?.trim().length ?? 0;
  let descScore = 0;
  if (descLen === 0) {
    suggestions.push(locale === "ar" ? "أضف وصفاً تفصيلياً للمنتج." : "Add a detailed description.");
  } else if (descLen < 80) {
    descScore = 5;
    suggestions.push(locale === "ar" ? "الوصف قصير جداً (100–500 حرف مثالية)." : "Description is too short (100–500 characters ideal).");
  } else if (descLen <= 700) {
    descScore = 20;
  } else {
    descScore = 18;
  }

  // Images: 15 pts. 1+ = 5, 3+ = 10, 5+ = 15.
  const imageCount = listing.images?.length ?? 0;
  let imageScore = 0;
  if (imageCount === 0) {
    suggestions.push(locale === "ar" ? "أضف صوراً للإعلان." : "Add listing images.");
  } else if (imageCount < 3) {
    imageScore = 5;
    suggestions.push(locale === "ar" ? "أضف 3 صور على الأقل." : "Add at least 3 images.");
  } else if (imageCount < 5) {
    imageScore = 10;
    suggestions.push(locale === "ar" ? "أضف 5 صور لتحسين الظهور." : "Add 5 images for better visibility.");
  } else {
    imageScore = 15;
  }

  // Price: 10 pts.
  const priceScore = listing.price > 0 ? 10 : 0;
  if (priceScore === 0) {
    suggestions.push(locale === "ar" ? "أضف سعراً." : "Add a price.");
  }

  // Location: 10 pts.
  const locationScore = listing.location?.trim().length ? 10 : 0;
  if (locationScore === 0) {
    suggestions.push(locale === "ar" ? "أضف الموقع." : "Add a location.");
  }

  // Category: 10 pts.
  const categoryScore = listing.category?.trim().length ? 10 : 0;
  if (categoryScore === 0) {
    suggestions.push(locale === "ar" ? "اختر تصنيفاً." : "Choose a category.");
  }

  // Condition: 10 pts.
  const conditionScore = listing.condition ? 10 : 0;

  // Status: 10 pts (active = full).
  const statusScore = listing.status === "active" ? 10 : 0;
  if (listing.status !== "active") {
    suggestions.push(locale === "ar" ? "فعّل الإعلان ليظهر في البحث." : "Activate the listing to appear in search.");
  }

  const breakdown: ListingScoreBreakdown = {
    title: titleScore,
    description: descScore,
    images: imageScore,
    price: priceScore,
    location: locationScore,
    category: categoryScore,
    condition: conditionScore,
    status: statusScore,
    total: 0,
  };

  const max = 100;
  const score = clamp(
    titleScore + descScore + imageScore + priceScore + locationScore + categoryScore + conditionScore + statusScore,
    0,
    max,
  );
  breakdown.total = score;
  const percentage = Math.round((score / max) * 100);

  return {
    score,
    max,
    percentage,
    grade: gradeFromPercentage(percentage),
    breakdown,
    suggestions: suggestions.slice(0, 5),
  };
}
