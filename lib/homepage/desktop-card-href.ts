/** In-app path for a subscription feature home card (matches tab routes). */
export function hrefForSubscriptionFeature(featureKey: string): string {
  switch (featureKey) {
    case "rfq":
      return "/rfq";
    case "live_map":
      return "/map";
    case "premium_listings":
      return "/listings/new";
    case "all":
      return "/profile";
    default:
      return "/profile";
  }
}
