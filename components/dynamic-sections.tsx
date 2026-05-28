"use client";

import Link from "next/link";
import { useBilingualText } from "@/lib/bilingual-text";
import type { SectionConfig } from "@/lib/homepage/types";
import { MobileSlider } from "./mobile-slider";

interface Props {
  section: SectionConfig;
  categories?: any[];
  flashDeals?: any[];
  trending?: any[];
  suppliers?: any[];
}

export function ListingCategorySection({ section, categories = [] }: Props) {
  const getText = useBilingualText();
  const { categorySlug = '', limit = 10 } = section.customData || {};
  
  // Filter categories by slug if specified
  const filteredCategories = categorySlug 
    ? categories.filter(cat => cat.slug === categorySlug).slice(0, limit)
    : categories.slice(0, limit);

  if (filteredCategories.length === 0) return null;

  return (
    <div className="bg-white px-3 py-3">
      <h3 className="mb-3 text-[15px] font-bold text-[var(--bina-text)]">
        {getText(section.title)}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {filteredCategories.map((cat: any) => (
          <Link
            key={cat.slug}
            href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
            className="rounded-lg border border-[#ebebeb] p-3 text-center"
          >
            <div className="text-[20px] mb-1">{cat.icon_emoji ?? "📦"}</div>
            <div className="text-[12px] font-medium text-[var(--bina-text)]">
              {cat.label_ar}
            </div>
          </Link>
        ))}
      </div>
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
