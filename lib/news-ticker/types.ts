export type TickerPlatform = "web" | "mobile" | "both";
export type TickerPageScope = "all" | "home" | "listings" | "blog" | "rfq" | "custom";
export type TickerDataSource = "custom" | "seo_posts" | "listings" | "rfq";

export type NewsTickerItem = {
  id: string;
  textAr: string;
  textEn: string;
  href: string;
  enabled: boolean;
  sortOrder: number;
};

export type NewsTickerConfig = {
  id: string;
  name: string;
  enabled: boolean;
  platform: TickerPlatform;
  pageScope: TickerPageScope;
  pagePath: string;
  dataSource: TickerDataSource;
  maxItems: number;
  speedSeconds: number;
  labelAr: string;
  labelEn: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  sortOrder: number;
  items: NewsTickerItem[];
};

export type ResolvedTickerLine = {
  id: string;
  text: string;
  href: string | null;
};

export type ResolvedNewsTicker = {
  id: string;
  label: string;
  speedSeconds: number;
  bgColor: string;
  textColor: string;
  accentColor: string;
  lines: ResolvedTickerLine[];
};
