"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { HomepageContent, SectionConfig } from "@/lib/homepage/types";
import { DEFAULT_CONTENT, DEFAULT_SECTIONS } from "@/lib/homepage/types";
import { useBilingualText } from "@/lib/bilingual-text";
import { ListingCategorySection, DataChartSection, CustomContentSection } from "./dynamic-sections";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorefrontCategory = {
  slug: string;
  label_ar: string;
  label_en?: string | null;
  icon_emoji?: string | null;
};

export type StorefrontListing = {
  id: string;
  title: string;
  price: number;
  price_unit: string;
  category: string;
  location: string | null;
  images: string[];
  view_count: number;
  created_at: string;
};

export type StorefrontSupplier = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  verified: boolean;
  listing_count: number;
};

export type StorefrontOrder = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  amount?: number | null;
};

type Props = {
  hasUser: boolean;
  displayName?: string | null;
  categories: StorefrontCategory[];
  flashDeals: StorefrontListing[];
  trending: StorefrontListing[];
  suppliers: StorefrontSupplier[];
  recentOrders: StorefrontOrder[];
  latestRfqHref?: string | null;
  sections?: SectionConfig[];
  content?: HomepageContent;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Array<{ bg: string; stroke: string }> = [
  { bg: "#FFF3E0", stroke: "#E65100" },
  { bg: "#E8F5E9", stroke: "#2E7D32" },
  { bg: "#E3F2FD", stroke: "#1565C0" },
  { bg: "#F3E5F5", stroke: "#6A1B9A" },
  { bg: "#E0F7FA", stroke: "#00695C" },
  { bg: "#FFF8E1", stroke: "#F57F17" },
  { bg: "#FCE4EC", stroke: "#880E4F" },
  { bg: "#E8EAF6", stroke: "#283593" },
  { bg: "#E0F2F1", stroke: "#00695C" },
  { bg: "#F5F5F5", stroke: "#555555" },
];

function colorFor(idx: number) {
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
}

function formatPrice(p: number, unit: string) {
  return `${p.toLocaleString()} ${unit}`;
}

function discountFor(id: string): number {
  // Deterministic 20–49 % discount based on string hash — pure function
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 20 + (Math.abs(h) % 30);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeStorefront({
  hasUser,
  displayName,
  categories,
  flashDeals,
  trending,
  suppliers,
  recentOrders,
  latestRfqHref,
  sections,
  content,
}: Props) {
  const t = useTranslations("storefront");
  const getText = useBilingualText();

  // Use provided config or defaults
  const activeSections = sections ?? DEFAULT_SECTIONS;
  const homepageContent = content ?? DEFAULT_CONTENT;

  // Helper to check if section is enabled
  const isSectionEnabled = (type: string) => {
    const section = activeSections.find((s) => s.type === type);
    return section?.enabled ?? true;
  };

  // Helper to get enabled sections sorted by order
  const getEnabledSections = () => {
    return activeSections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order);
  };

  // Flash deals timer - use config values
  const [secondsLeft, setSecondsLeft] = useState(
    homepageContent.flash_deals.timerHours * 3600 +
      homepageContent.flash_deals.timerMinutes * 60 +
      homepageContent.flash_deals.timerSeconds
  );
  useEffect(() => {
    const i = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tH = Math.floor(secondsLeft / 3600);
  const tM = Math.floor((secondsLeft % 3600) / 60);
  const tS = secondsLeft % 60;

  // Render section based on type
  const renderSection = (section: SectionConfig) => {
    switch (section.type) {
      case 'stories':
        if (categories.length === 0) return null;
        return (
          <div key={section.id} className="flex gap-3 overflow-x-auto bg-white px-3.5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.slice(0, 8).map((cat, i) => {
              const c = colorFor(i);
              return (
                <Link
                  key={cat.slug}
                  href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <div
                    className="h-14 w-14 rounded-full p-[2px]"
                    style={{
                      background: i < 3
                        ? "conic-gradient(#C62828 0%,#FFCA28 50%,#C62828 100%)"
                        : "#e0e0e0",
                    }}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white" style={{ background: c.bg }}>
                      <span className="text-[20px]">{cat.icon_emoji ?? "📦"}</span>
                    </div>
                  </div>
                  <span className="line-clamp-1 max-w-[56px] text-center text-[10px] text-[#444]">
                    {cat.label_ar}
                  </span>
                </Link>
              );
            })}
          </div>
        );

      case 'listing_category':
        return (
          <ListingCategorySection 
            key={section.id} 
            section={section} 
            categories={categories} 
          />
        );

      case 'data_chart':
        return (
          <DataChartSection key={section.id} section={section} />
        );

      case 'custom_content':
        return (
          <CustomContentSection key={section.id} section={section} />
        );

      // Keep existing sections with their original rendering
      case 'hero':
        return (
          <div key={section.id} className="bg-[var(--bina-primary)]">
            <div className="mx-3 mt-1.5 mb-1.5 overflow-hidden rounded-2xl bg-[var(--bina-primary-lt)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--bina-accent)]">
                {getText(homepageContent.hero.kicker)}
              </div>
              <h2 className="mt-1.5 text-[20px] font-bold leading-tight tracking-tight text-white">
                {getText(homepageContent.hero.title)}
              </h2>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">
                {getText(homepageContent.hero.subtitle)}
              </p>
              <div className="mt-3.5 flex gap-2">
                <Link
                  href="/gallery"
                  className="rounded-lg bg-[var(--bina-accent)] px-4 py-2 text-[12px] font-bold text-[var(--bina-on-accent)] active:opacity-80"
                >
                  {getText(homepageContent.hero.browseDealsText)}
                </Link>
                <Link
                  href="/rfq/new"
                  className="rounded-lg border border-white/30 bg-white/15 px-4 py-2 text-[12px] font-semibold text-white active:opacity-80"
                >
                  {getText(homepageContent.hero.postRfqText)}
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t border-white/15 bg-[var(--bina-primary-dk)]">
              <div className="border-r border-white/15 py-2.5 text-center">
                <div className="text-[16px] font-bold text-[var(--bina-accent)]">{homepageContent.hero.stats.products}</div>
                <div className="text-[10px] text-white/65">{t("statProducts")}</div>
              </div>
              <div className="border-r border-white/15 py-2.5 text-center">
                <div className="text-[16px] font-bold text-[var(--bina-accent)]">{homepageContent.hero.stats.suppliers}</div>
                <div className="text-[10px] text-white/65">{t("statSuppliers")}</div>
              </div>
              <div className="py-2.5 text-center">
                <div className="text-[16px] font-bold text-[var(--bina-accent)]">{homepageContent.hero.stats.onTime}</div>
                <div className="text-[10px] text-white/65">{t("statOnTime")}</div>
              </div>
            </div>
          </div>
        );

      case 'membership':
        if (!hasUser) return null;
        return (
          <div key={section.id} className="px-3">
            <Link
              href="/profile"
              className="relative block overflow-hidden rounded-2xl bg-[#1a1a1a] p-4"
            >
              <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--bina-primary)] opacity-30" />
              <div className="absolute -bottom-7 -left-2 h-20 w-20 rounded-full bg-[var(--bina-accent)] opacity-[0.12]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-semibold tracking-wider text-[var(--bina-accent)]">
                    ✦ {getText(homepageContent.membership.kicker)}
                  </div>
                  <div className="mt-1.5 text-[17px] font-bold text-white">
                    {getText(homepageContent.membership.welcomeText).replace("{name}", displayName ?? "")}
                  </div>
                  <div className="mt-1 text-[12px] text-white/60">
                    {getText(homepageContent.membership.subtitle)}
                  </div>
                </div>
                <span className="rounded-lg bg-[var(--bina-accent)] px-3.5 py-2 text-[12px] font-bold text-[var(--bina-on-accent)]">
                  {getText(homepageContent.membership.redeemButton)}
                </span>
              </div>
              <div className="relative mt-3.5 flex gap-4">
                {homepageContent.membership.perks.map((p, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[15px] font-bold text-[var(--bina-accent)]">{p.value}</div>
                    <div className="mt-0.5 text-[10px] text-white/55">{getText(p.label)}</div>
                  </div>
                ))}
              </div>
            </Link>
          </div>
        );

      case 'flash_deals':
        if (flashDeals.length === 0) return null;
        return (
          <div key={section.id} className="bg-white">
            <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bina-primary)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFCA28">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[var(--bina-text)]">{getText(homepageContent.flash_deals.title)}</div>
                  <div className="text-[11px] text-[#888]">{getText(homepageContent.flash_deals.subtitle)}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <span className="min-w-[28px] rounded-md bg-[#1a1a1a] px-1.5 py-1 text-center text-[13px] font-bold tabular-nums text-white">{pad(tH)}</span>
                <span className="text-[11px] font-bold text-[#888]">:</span>
                <span className="min-w-[28px] rounded-md bg-[#1a1a1a] px-1.5 py-1 text-center text-[13px] font-bold tabular-nums text-white">{pad(tM)}</span>
                <span className="text-[11px] font-bold text-[#888]">:</span>
                <span className="min-w-[28px] rounded-md bg-[#1a1a1a] px-1.5 py-1 text-center text-[13px] font-bold tabular-nums text-white">{pad(tS)}</span>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto px-3.5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {flashDeals.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="flex w-[120px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#ebebeb] bg-[#f9f9f9]"
                >
                  <div className="relative flex h-20 items-center justify-center bg-[#FFF3E0]">
                    <span className="absolute left-1.5 top-1.5 rounded bg-[var(--bina-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      -{discountFor(listing.id)}%
                    </span>
                    {listing.images[0] ? (
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <span className="text-[32px]">📦</span>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="line-clamp-2 min-h-[28px] text-[11px] text-[#222]">{listing.title}</div>
                    <div className="mt-0.5 text-[14px] font-bold text-[var(--bina-primary)]">
                      {formatPrice(listing.price, listing.price_unit)}
                    </div>
                    <div className="mt-1 h-[3px] rounded-sm bg-[#eee]">
                      <div className="h-full rounded-sm bg-[var(--bina-primary)]" style={{ width: `${Math.min(95, 40 + listing.view_count)}%` }} />
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-[var(--bina-primary)]">
                      {Math.min(95, 40 + listing.view_count)}% {t("claimed")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );

      case 'promo_banners':
        return (
          <div key={section.id} className="px-3">
            <div className="grid grid-cols-2 gap-2">
              {homepageContent.promo_banners.cards.map((card, index) => {
                const bgColor = card.color === 'primary' ? 'bg-[var(--bina-primary)]' :
                               card.color === 'dark' ? 'bg-[#1a1a1a]' :
                               card.color === 'orange' ? 'bg-[#E65100]' :
                               'bg-[#1B5E20]';
                const textColor = card.color === 'primary' ? 'text-[var(--bina-accent)]' :
                                 card.color === 'dark' ? 'text-[var(--bina-accent)]' :
                                 card.color === 'orange' ? 'text-white' :
                                 'text-[var(--bina-accent)]';
                const kickerColor = card.color === 'primary' ? 'text-white/70' :
                                   card.color === 'dark' ? 'text-white/50' :
                                   card.color === 'orange' ? 'text-white/70' :
                                   'text-white/70';
                
                return (
                  <Link key={index} href={card.link} className={`rounded-2xl ${bgColor} p-3.5`}>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${kickerColor}`}>
                      {getText(card.kicker)}
                    </div>
                    <div className="mt-1 text-[13px] font-bold leading-tight text-white">
                      {getText(card.title)}
                    </div>
                    <div className={`mt-2 text-[11px] font-bold ${textColor}`}>
                      {getText(card.cta)} ›
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      case 'rfq':
        return (
          <div key={section.id} className="px-3">
            <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-white">
              <div className="bg-[var(--bina-primary)] px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <div className="text-[15px] font-bold text-white">{getText(homepageContent.rfq.title)}</div>
                </div>
                <div className="mt-1 text-[12px] text-white/70">{getText(homepageContent.rfq.subtitle)}</div>
              </div>
              <Link
                href={latestRfqHref ?? "/rfq/new"}
                className="flex w-full items-center justify-center gap-1.5 bg-[var(--bina-primary)] px-4 py-3.5 text-[14px] font-bold text-white active:opacity-90"
              >
                {getText(homepageContent.rfq.cta)}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 pb-4">
      {getEnabledSections().map(section => renderSection(section))}
    </div>
  );
}
