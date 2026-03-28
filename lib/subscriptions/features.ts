export type SubscriptionFeature = "rfq" | "live_map" | "premium_listings" | "all";

export const SUBSCRIPTION_FEATURES: SubscriptionFeature[] = [
  "rfq",
  "live_map",
  "premium_listings",
  "all",
];

export const FEATURE_LABELS: Record<SubscriptionFeature, { ar: string; en: string }> = {
  rfq: { ar: "طلبات العروض (RFQ)", en: "Request for Quotes (RFQ)" },
  live_map: { ar: "الخريطة المباشرة", en: "Live Map" },
  premium_listings: { ar: "الإعلانات المميزة", en: "Premium Listings" },
  all: { ar: "جميع الميزات", en: "All Features" },
};

export function featureLabel(feature: SubscriptionFeature, locale: "ar" | "en" = "ar"): string {
  return FEATURE_LABELS[feature][locale];
}
