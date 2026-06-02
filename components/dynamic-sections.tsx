"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useBilingualText } from "@/lib/bilingual-text";
import type { SectionConfig } from "@/lib/homepage/types";
import type { StorefrontListing } from "./home-storefront";
import { MobileSlider } from "./mobile-slider";

interface Props {
  section: SectionConfig;
  categories?: any[];
  flashDeals?: any[];
  trending?: any[];
  suppliers?: any[];
  categoryListings?: Record<string, StorefrontListing[]>;
}

export function ListingCategorySection({ section, categories = [], categoryListings = {} }: Props) {
  const getText = useBilingualText();
  const t = useTranslations("listingCategory");
  const { categorySlug = '', rows = 2 } = section.customData || {};

  const listings = categorySlug ? (categoryListings[categorySlug] ?? []) : [];
  const maxItems = rows * 2; // 2 columns
  const visibleListings = listings.slice(0, maxItems);

  if (!categorySlug) return null;

  return (
    <div className="bg-white px-3 py-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[var(--bina-text)]">
          {getText(section.title)}
        </h3>
        <Link
          href={`/gallery?category=${encodeURIComponent(categorySlug)}`}
          className="text-[12px] font-medium text-[var(--bina-primary)]"
        >
          {t("viewAll")}
        </Link>
      </div>

      {visibleListings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#e0e0e0] p-6 text-center">
          <p className="text-[12px] text-[#999]">{t("noListings")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {visibleListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="overflow-hidden rounded-xl border border-[#ebebeb] bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[5/4] w-full overflow-hidden bg-[#f5f5f5]">
                {listing.images[0] ? (
                  <Image
                    alt={listing.title}
                    className="object-cover"
                    fill
                    sizes="50vw"
                    src={listing.images[0]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[20px] text-[#ccc]">
                    📦
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <span className="line-clamp-2 min-h-[32px] text-[12px] font-medium leading-snug text-[var(--bina-text)]">
                  {listing.title}
                </span>
                <span className="font-bina-display text-[14px] font-bold text-[var(--bina-primary)]">
                  {listing.price.toLocaleString()}{" "}
                  <span className="text-[10px] font-normal text-[#999]">
                    {listing.price_unit}
                  </span>
                </span>
                {listing.location ? (
                  <span className="line-clamp-1 text-[10px] text-[#999]">
                    {listing.location}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function DataChartSection({ section }: Props) {
  const getText = useBilingualText();
  const { chartType = 'bar', dataSource = 'sales', title } = section.customData || {};
  
  return (
    <div className="bg-white px-3 py-3">
      <h3 className="mb-3 text-[15px] font-bold text-[var(--bina-text)]">
        {title ? getText(title) : getText(section.title)}
      </h3>
      <div className="rounded-lg border border-[#ebebeb] p-4 text-center">
        <div className="text-[24px] mb-2">📊</div>
        <div className="text-[12px] text-[#666]">
          {chartType} chart - {dataSource}
        </div>
        <div className="mt-3 text-[10px] text-[#999]">
          Chart visualization would be rendered here
        </div>
      </div>
    </div>
  );
}

export function CustomContentSection({ section }: Props) {
  const getText = useBilingualText();
  const { content = { ar: '', en: '' }, backgroundColor = '#ffffff' } = section.customData || {};
  
  return (
    <div className="px-3 py-3" style={{ backgroundColor }}>
      <h3 className="mb-3 text-[15px] font-bold text-[var(--bina-text)]">
        {getText(section.title)}
      </h3>
      <div className="rounded-lg border border-[#ebebeb] p-4">
        <div className="text-[13px] text-[var(--bina-text)] leading-relaxed">
          {getText(content)}
        </div>
      </div>
    </div>
  );
}

export function SliderSection({ section }: Props) {
  const getText = useBilingualText();
  const { 
    items = [], 
    autoPlay = true, 
    interval = 3000, 
    showDots = true, 
    showArrows = false 
  } = section.customData || {};

  if (items.length === 0) {
    return (
      <div className="px-3 py-3">
        <h3 className="mb-3 text-[15px] font-bold text-[var(--bina-text)]">
          {getText(section.title)}
        </h3>
        <div className="rounded-lg border border-[#ebebeb] p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📱</div>
          <p className="text-sm">No slider items configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <h3 className="mb-3 text-[15px] font-bold text-[var(--bina-text)]">
        {getText(section.title)}
      </h3>
      <MobileSlider
        items={items}
        autoPlay={autoPlay}
        interval={interval}
        showDots={showDots}
        showArrows={showArrows}
        className="rounded-lg"
      />
    </div>
  );
}
