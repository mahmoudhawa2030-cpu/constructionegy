"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
}: Props) {
  const t = useTranslations("storefront");

  // Flash deals timer (5h 28m 44s starting state, matches mockup)
  const [secondsLeft, setSecondsLeft] = useState(5 * 3600 + 28 * 60 + 44);
  useEffect(() => {
    const i = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tH = Math.floor(secondsLeft / 3600);
  const tM = Math.floor((secondsLeft % 3600) / 60);
  const tS = secondsLeft % 60;

  return (
    <div className="flex flex-col gap-2 pb-4">

      {/* ── STORIES (categories ring) ─────────────────────────────────────── */}
      {categories.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto bg-white px-3.5 py-3 [scrollbar-width:none] sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {categories.slice(0, 8).map((cat, i) => {
            const c = colorFor(i);
            return (
              <Link
                key={cat.slug}
                href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
                className="flex shrink-0 flex-col items-center gap-1.5 sm:shrink"
              >
                <div
                  className="h-14 w-14 rounded-full p-[2px] sm:h-16 sm:w-16"
                  style={{
                    background: i < 3
                      ? "conic-gradient(#C62828 0%,#FFCA28 50%,#C62828 100%)"
                      : "#e0e0e0",
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white" style={{ background: c.bg }}>
                    <span className="text-[20px] sm:text-[22px]">{cat.icon_emoji ?? "📦"}</span>
                  </div>
                </div>
                <span className="line-clamp-1 max-w-[56px] text-center text-[10px] text-[#444] sm:max-w-[64px]">
                  {cat.label_ar}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[var(--bina-primary)] to-[#a81f1f] py-8 sm:py-12 md:py-16">
        <div className="px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            Global B2B Wholesale Marketplace
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base md:text-lg">
            Connect with 50,000+ verified suppliers. Source products at factory prices with trade assurance protection.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/gallery"
              className="rounded-lg bg-[var(--bina-accent)] px-6 py-3 text-sm font-bold text-[var(--bina-on-accent)] hover:bg-[#ffc947] sm:text-base"
            >
              Browse Suppliers
            </Link>
            <Link
              href="/rfq/new"
              className="rounded-lg border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 sm:text-base"
            >
              Post RFQ
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-white/70">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Trade Assurance</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Verified Suppliers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MEMBERSHIP CARD (logged-in) ──────────────────────────────────── */}
      {hasUser ? (
        <div className="px-3">
          <Link
            href="/profile"
            className="relative block overflow-hidden rounded-2xl bg-[#1a1a1a] p-4"
          >
            <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[var(--bina-primary)] opacity-30" />
            <div className="absolute -bottom-7 -left-2 h-20 w-20 rounded-full bg-[var(--bina-accent)] opacity-[0.12]" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-[var(--bina-accent)]">
                  ✦ {t("memberKicker")}
                </div>
                <div className="mt-1.5 text-[17px] font-bold text-white">
                  {t("welcomeBack", { name: displayName ?? "" })}
                </div>
                <div className="mt-1 text-[12px] text-white/60">
                  {t("memberSub")}
                </div>
              </div>
              <span className="rounded-lg bg-[var(--bina-accent)] px-3.5 py-2 text-[12px] font-bold text-[var(--bina-on-accent)]">
                {t("redeem")}
              </span>
            </div>
            <div className="relative mt-3.5 flex gap-4">
              {[
                { v: "12%", l: t("perkDiscount") },
                { v: t("perkFreeVal"), l: t("perkFreight") },
                { v: "Net-60", l: t("perkTerms") },
                { v: "24/7", l: t("perkSupport") },
              ].map((p, i) => (
                <div key={i} className="text-center">
                  <div className="text-[15px] font-bold text-[var(--bina-accent)]">{p.v}</div>
                  <div className="mt-0.5 text-[10px] text-white/55">{p.l}</div>
                </div>
              ))}
            </div>
          </Link>
        </div>
      ) : null}

      {/* ── FEATURE CARDS (Flash Deals, RFQ, New Buyer) ───────────────────── */}
      <div className="grid gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
        {/* Flash Deals Card */}
        <Link href="/gallery" className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--bina-primary)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFCA28">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--bina-text)]">Flash Deals</h3>
              <p className="text-sm text-gray-500">Limited time offers</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-[var(--bina-primary)] font-medium group-hover:underline">
            View all deals →
          </div>
        </Link>

        {/* RFQ Card */}
        <Link href="/rfq/new" className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--bina-text)]">Request for Quotation</h3>
              <p className="text-sm text-gray-500">Get quotes from multiple suppliers</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-[var(--bina-primary)] font-medium group-hover:underline">
            Submit RFQ →
          </div>
        </Link>

        {/* New Buyer Offer Card */}
        <Link href="/subscription-required" className="group overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--bina-text)]">New Buyer Offer</h3>
              <p className="text-sm text-gray-500">$50 off first order over $500</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-[var(--bina-primary)] font-medium group-hover:underline">
            Learn more →
          </div>
        </Link>
      </div>

      {/* ── FLASH DEALS ───────────────────────────────────────────────────── */}
      {flashDeals.length > 0 ? (
        <div className="bg-white">
          <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bina-primary)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFCA28">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[var(--bina-text)]">{t("flashDeals")}</div>
                <div className="text-[11px] text-[#888]">{t("flashSub")}</div>
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
          <div className="flex gap-2 overflow-x-auto px-3.5 pb-3 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:overflow-visible md:grid-cols-5 lg:grid-cols-6 [&::-webkit-scrollbar]:hidden">
            {flashDeals.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex w-[120px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#ebebeb] bg-[#f9f9f9] sm:w-auto"
              >
                <div className="relative flex h-20 items-center justify-center bg-[#FFF3E0] sm:h-24">
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
      ) : null}

      {/* ── CATEGORIES GRID ──────────────────────────────────────────────── */}
      {categories.length > 0 ? (
        <div className="bg-white px-3.5 py-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[var(--bina-text)]">{t("shopByCategory")}</h3>
            <Link href="/gallery" className="text-[12px] font-medium text-[var(--bina-primary)]">
              {t("allCount", { count: categories.length })} ›
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {categories.slice(0, 10).map((cat, i) => {
              const c = colorFor(i);
              return (
                <Link
                  key={cat.slug}
                  href={`/gallery?category=${encodeURIComponent(cat.slug)}`}
                  className="flex flex-col items-center gap-1.5 py-1"
                >
                  <div
                    className="flex h-[50px] w-[50px] items-center justify-center rounded-xl sm:h-[56px] sm:w-[56px]"
                    style={{ background: c.bg }}
                  >
                    <span className="text-[22px] sm:text-[24px]">{cat.icon_emoji ?? "📦"}</span>
                  </div>
                  <span className="line-clamp-2 text-center text-[10px] leading-tight text-[#555]">
                    {cat.label_ar}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── TRENDING PRODUCTS GRID ───────────────────────────────────────── */}
      {trending.length > 0 ? (
        <div className="bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--bina-text)] sm:text-2xl">Trending Products</h2>
              <p className="mt-1 text-sm text-gray-500">Most popular wholesale items this week</p>
            </div>
            <Link href="/gallery" className="text-sm font-medium text-[var(--bina-primary)] hover:underline">
              View all products →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            {trending.map((listing, i) => {
              const badges = ["Hot", "New", "-25%", "Bulk"];
              const badgeClr = ["#FFEBEE,#B71C1C", "#E8F5E9,#1B5E20", "#FFF8E1,#E65100", "#EDE7F6,#4527A0"];
              const [bg, txt] = badgeClr[i % 4].split(",");
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square bg-gray-100">
                    <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold" style={{ background: bg, color: txt }}>
                      {badges[i % 4]}
                    </span>
                    {listing.images[0] ? (
                      <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-[var(--bina-primary)]">{listing.title}</h3>
                    <div className="mt-2 text-base font-bold text-[var(--bina-primary)]">
                      {formatPrice(listing.price, listing.price_unit)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      MOQ: 100 units
                    </div>
                    {listing.location ? (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {listing.location}
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── PROMO BANNERS ────────────────────────────────────────────────── */}
      <div className="px-3">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/gallery" className="rounded-2xl bg-[var(--bina-primary)] p-3.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/70">{t("promoShippingKicker")}</div>
            <div className="mt-1 text-[13px] font-bold leading-tight text-white">{t("promoShipping")}</div>
            <div className="mt-2 text-[11px] font-bold text-[var(--bina-accent)]">{t("claimNow")} ›</div>
          </Link>
          <Link href="/subscription-required" className="rounded-2xl bg-[#1a1a1a] p-3.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/50">{t("promoTermsKicker")}</div>
            <div className="mt-1 text-[13px] font-bold leading-tight text-white">{t("promoTerms")}</div>
            <div className="mt-2 text-[11px] font-bold text-[var(--bina-accent)]">{t("applyNow")} ›</div>
          </Link>
          <Link href="/gallery" className="rounded-2xl bg-[#E65100] p-3.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/70">{t("promoTrustKicker")}</div>
            <div className="mt-1 text-[13px] font-bold leading-tight text-white">{t("promoTrust")}</div>
            <div className="mt-2 text-[11px] font-bold text-white">{t("learnMore")} ›</div>
          </Link>
          <Link href="/users" className="rounded-2xl bg-[#1B5E20] p-3.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white/70">{t("promoNewKicker")}</div>
            <div className="mt-1 text-[13px] font-bold leading-tight text-white">{t("promoNew")}</div>
            <div className="mt-2 text-[11px] font-bold text-[var(--bina-accent)]">{t("browseAll")} ›</div>
          </Link>
        </div>
      </div>

      {/* ── VERIFIED SUPPLIERS ───────────────────────────────────────────── */}
      {suppliers.length > 0 ? (
        <div className="bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--bina-text)] sm:text-2xl">Verified Suppliers</h2>
              <p className="mt-1 text-sm text-gray-500">Trusted manufacturers with trade assurance</p>
            </div>
            <Link href="/users" className="text-sm font-medium text-[var(--bina-primary)] hover:underline">
              View all suppliers →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {suppliers.map((s, i) => {
              const c = colorFor(i);
              const initials = s.display_name.slice(0, 2).toUpperCase();
              const years = [12, 8, 5, 15, 3, 10][i % 6];
              return (
                <Link
                  key={s.id}
                  href={`/users/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ background: c.bg, color: c.stroke }}
                  >
                    {s.avatar_url ? (
                      <Image src={s.avatar_url} alt={s.display_name} width={48} height={48} className="rounded-lg object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-900">{s.display_name}</div>
                    <div className="text-xs text-gray-500">{years} years | {s.listing_count} products</div>
                    {s.verified ? (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-xs text-green-600">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Verified
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ── RFQ FORM ─────────────────────────────────────────────────────── */}
      <div className="px-3">
        <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-white">
          <div className="bg-[var(--bina-primary)] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <div className="text-[15px] font-bold text-white">{t("rfqTitle")}</div>
            </div>
            <div className="mt-1 text-[12px] text-white/70">{t("rfqSub")}</div>
          </div>
          <Link
            href={latestRfqHref ?? "/rfq/new"}
            className="flex w-full items-center justify-center gap-1.5 bg-[var(--bina-primary)] px-4 py-3.5 text-[14px] font-bold text-white active:opacity-90"
          >
            {t("rfqCta")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── RECENT ORDERS ────────────────────────────────────────────────── */}
      {hasUser && recentOrders.length > 0 ? (
        <div className="px-3">
          <div className="mb-2 mt-1 flex items-center justify-between px-0.5">
            <h3 className="text-[15px] font-bold text-[var(--bina-text)]">{t("recentOrders")}</h3>
            <Link href="/bookings" className="text-[12px] font-medium text-[var(--bina-primary)]">
              {t("viewAll")} ›
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#ebebeb] bg-white">
            {recentOrders.map((o, idx) => {
              const statusColors: Record<string, { bg: string; text: string }> = {
                delivered: { bg: "#E8F5E9", text: "#1B5E20" },
                in_transit: { bg: "#FFF3E0", text: "#E65100" },
                processing: { bg: "#E3F2FD", text: "#1565C0" },
              };
              const c = statusColors[o.status.toLowerCase().replace(/\s+/g, "_")] ?? { bg: "#f5f5f5", text: "#555" };
              return (
                <Link
                  key={o.id}
                  href={`/bookings`}
                  className={`flex items-center gap-2.5 px-3.5 py-3 ${idx < recentOrders.length - 1 ? "border-b border-[#f7f7f7]" : ""}`}
                >
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl" style={{ background: c.bg }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[var(--bina-text)]">#{o.id.slice(0, 8)}</div>
                    <div className="line-clamp-1 text-[11px] text-[#999]">{o.title}</div>
                    <div className="text-[10px] text-[#bbb]">{timeAgo(o.created_at)}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    {o.amount ? (
                      <div className="text-[13px] font-bold text-[var(--bina-text)]">{formatPrice(o.amount, "EGP")}</div>
                    ) : null}
                    <div className="mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold" style={{ background: c.bg, color: c.text }}>
                      {o.status}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
