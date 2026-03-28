/** Logical subscription feature key (matches `subscription_services.feature_key` and `subscriptions.feature`). */
export type SubscriptionFeature = string;

/** Built-in keys (seeded in DB). New services are added in Admin → Subscription services. */
export const SUBSCRIPTION_FEATURES: SubscriptionFeature[] = [
  "all",
  "rfq",
  "live_map",
  "premium_listings",
];

export const FEATURE_LABELS: Record<string, { ar: string; en: string }> = {
  rfq: { ar: "طلبات العروض (RFQ)", en: "Request for Quotes (RFQ)" },
  live_map: { ar: "الخريطة المباشرة", en: "Live Map" },
  premium_listings: { ar: "الإعلانات المميزة", en: "Premium Listings" },
  all: { ar: "جميع الميزات", en: "All Features" },
};

export function featureLabel(feature: string, locale: "ar" | "en" = "ar"): string {
  const row = FEATURE_LABELS[feature];
  if (row) return row[locale];
  return feature;
}
