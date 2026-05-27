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

export interface BilingualText {
  ar: string;
  en: string;
}

export interface SectionConfig {
  id: SectionId;
  enabled: boolean;
  order: number;
  title: string;
}

export interface PromoCardConfig {
  kicker: BilingualText;
  title: BilingualText;
  cta: BilingualText;
  link: string;
  color: "primary" | "dark" | "orange" | "green";
}

export interface MembershipPerk {
  value: string;
  label: BilingualText;
}

export interface HeroStats {
  products: string;
  suppliers: string;
  onTime: string;
}

export interface HeroContent {
  kicker: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  browseDealsText: BilingualText;
  postRfqText: BilingualText;
  stats: HeroStats;
}

export interface FlashDealsContent {
  title: BilingualText;
  subtitle: BilingualText;
  timerHours: number;
  timerMinutes: number;
  timerSeconds: number;
}

export interface MembershipContent {
  kicker: BilingualText;
  welcomeText: BilingualText;
  subtitle: BilingualText;
  redeemButton: BilingualText;
  perks: MembershipPerk[];
}

export interface PromoBannersContent {
  cards: PromoCardConfig[];
}

export interface RFQContent {
  title: BilingualText;
  subtitle: BilingualText;
  cta: BilingualText;
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
    kicker: { ar: "ابنِ بثقة", en: "BUILD WITH CONFIDENCE" },
    title: { ar: "سوق البناء رقم #1 في مصر", en: "Egypt's #1 Construction Marketplace" },
    subtitle: { ar: "مواد بناء عالية الجودة من الموردين الموثوقين", en: "High-quality construction materials from trusted suppliers" },
    browseDealsText: { ar: "تصفح الصفقات", en: "Browse Deals" },
    postRfqText: { ar: "نشر طلب عرض", en: "Post RFQ" },
    stats: {
      products: "50K+",
      suppliers: "3,200",
      onTime: "98%",
    },
  },
  flash_deals: {
    title: { ar: "الصفقات السريعة", en: "Flash Deals" },
    subtitle: { ar: "عروض محدودة الوقت", en: "Limited time offers" },
    timerHours: 5,
    timerMinutes: 28,
    timerSeconds: 44,
  },
  membership: {
    kicker: { ar: "عضوية مميزة", en: "PREMIUM MEMBERSHIP" },
    welcomeText: { ar: "مرحباً بعودتك", en: "Welcome Back" },
    subtitle: { ar: "استمتع بامتيازات حصرية", en: "Enjoy exclusive benefits" },
    redeemButton: { ar: "استرداد", en: "Redeem" },
    perks: [
      { value: "12%", label: { ar: "خصم خاص", en: "Special Discount" } },
      { value: "perkFreeVal", label: { ar: "شحن مجاني", en: "Free Shipping" } },
      { value: "Net-60", label: { ar: "شروط دفع مرنة", en: "Flexible Terms" } },
      { value: "24/7", label: { ar: "دعم على مدار الساعة", en: "24/7 Support" } },
    ],
  },
  promo_banners: {
    cards: [
      {
        kicker: { ar: "شحن مجاني", en: "FREE SHIPPING" },
        title: { ar: "على جميع الطلبات", en: "On All Orders" },
        cta: { ar: "اطلب الآن", en: "Claim Now" },
        link: "/gallery",
        color: "primary",
      },
      {
        kicker: { ar: "شروط مرنة", en: "FLEXIBLE TERMS" },
        title: { ar: "Net-60 دفع", en: "Net-60 Payment" },
        cta: { ar: "قدم الآن", en: "Apply Now" },
        link: "/subscription-required",
        color: "dark",
      },
      {
        kicker: { ar: "موثوق", en: "TRUSTED" },
        title: { ar: "موردين معتمدين", en: "Verified Suppliers" },
        cta: { ar: "اعرف المزيد", en: "Learn More" },
        link: "/gallery",
        color: "orange",
      },
      {
        kicker: { ar: "جديد", en: "NEW" },
        title: { ar: "انضم كعامل", en: "Join as Supplier" },
        cta: { ar: "تصفح الكل", en: "Browse All" },
        link: "/users",
        color: "green",
      },
    ],
  },
  rfq: {
    title: { ar: "تحتاج مواد بناء؟", en: "Need Construction Materials?" },
    subtitle: { ar: "احصل على عروض من موردين موثوقين", en: "Get quotes from trusted suppliers" },
    cta: { ar: "نشر طلب عرض", en: "Post RFQ" },
  },
};
