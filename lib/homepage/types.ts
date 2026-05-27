// Mobile homepage configuration types

export type SectionId =
  | "stories"
  | "hero"
  | "membership"
  | "flash_deals"
  | "categories"
  | "trending"
  | "promo_banners"
  | "suppliers"
  | "rfq"
  | "recent_orders";

export interface SectionConfig {
  id: SectionId;
  enabled: boolean;
  order: number;
  title: string;
}

export interface PromoCardConfig {
  kicker: string;
  title: string;
  cta: string;
  link: string;
  color: "primary" | "dark" | "orange" | "green";
}

export interface MembershipPerk {
  value: string;
  label: string;
}

export interface HeroStats {
  products: string;
  suppliers: string;
  onTime: string;
}

export interface HeroContent {
  kicker: string;
  title: string;
  subtitle: string;
  browseDealsText: string;
  postRfqText: string;
  stats: HeroStats;
}

export interface FlashDealsContent {
  title: string;
  subtitle: string;
  timerHours: number;
  timerMinutes: number;
  timerSeconds: number;
}

export interface MembershipContent {
  kicker: string;
  welcomeText: string;
  subtitle: string;
  redeemButton: string;
  perks: MembershipPerk[];
}

export interface PromoBannersContent {
  cards: PromoCardConfig[];
}

export interface RFQContent {
  title: string;
  subtitle: string;
  cta: string;
}

export interface HomepageContent {
  hero: HeroContent;
  flash_deals: FlashDealsContent;
  membership: MembershipContent;
  promo_banners: PromoBannersContent;
  rfq: RFQContent;
}

export interface MobileHomepageConfig {
  id: string;
  key: string;
  sections: SectionConfig[];
  content: HomepageContent;
  created_at: string;
  updated_at: string;
}

// Default sections order and settings
export const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "stories", enabled: true, order: 1, title: "Categories" },
  { id: "hero", enabled: true, order: 2, title: "Hero Banner" },
  { id: "membership", enabled: true, order: 3, title: "Membership Card" },
  { id: "flash_deals", enabled: true, order: 4, title: "Flash Deals" },
  { id: "categories", enabled: true, order: 5, title: "Categories Grid" },
  { id: "trending", enabled: true, order: 6, title: "Trending Products" },
  { id: "promo_banners", enabled: true, order: 7, title: "Promo Banners" },
  { id: "suppliers", enabled: true, order: 8, title: "Top Suppliers" },
  { id: "rfq", enabled: true, order: 9, title: "RFQ Form" },
  { id: "recent_orders", enabled: true, order: 10, title: "Recent Orders" },
];

// Default content (matches current hardcoded values)
export const DEFAULT_CONTENT: HomepageContent = {
  hero: {
    kicker: "heroKicker",
    title: "heroTitle",
    subtitle: "heroSubtitle",
    browseDealsText: "browseDeals",
    postRfqText: "postRfq",
    stats: {
      products: "50K+",
      suppliers: "3,200",
      onTime: "98%",
    },
  },
  flash_deals: {
    title: "flashDeals",
    subtitle: "flashSub",
    timerHours: 5,
    timerMinutes: 28,
    timerSeconds: 44,
  },
  membership: {
    kicker: "memberKicker",
    welcomeText: "welcomeBack",
    subtitle: "memberSub",
    redeemButton: "redeem",
    perks: [
      { value: "12%", label: "perkDiscount" },
      { value: "perkFreeVal", label: "perkFreight" },
      { value: "Net-60", label: "perkTerms" },
      { value: "24/7", label: "perkSupport" },
    ],
  },
  promo_banners: {
    cards: [
      {
        kicker: "promoShippingKicker",
        title: "promoShipping",
        cta: "claimNow",
        link: "/gallery",
        color: "primary",
      },
      {
        kicker: "promoTermsKicker",
        title: "promoTerms",
        cta: "applyNow",
        link: "/subscription-required",
        color: "dark",
      },
      {
        kicker: "promoTrustKicker",
        title: "promoTrust",
        cta: "learnMore",
        link: "/gallery",
        color: "orange",
      },
      {
        kicker: "promoNewKicker",
        title: "promoNew",
        cta: "browseAll",
        link: "/users",
        color: "green",
      },
    ],
  },
  rfq: {
    title: "rfqTitle",
    subtitle: "rfqSub",
    cta: "rfqCta",
  },
};
