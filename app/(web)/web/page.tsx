import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { CountdownTimer } from "@/components/web/countdown-timer";
import { getWebHomeData, type WebHomeItem } from "@/lib/homepage/web-home-data";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

function pick(ar: string | null | undefined, en: string | null | undefined, locale: string): string {
  if (locale === "ar") return (ar?.trim() || en?.trim() || "") as string;
  return (en?.trim() || ar?.trim() || "") as string;
}

function FireIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function itemPriceLabel(item: WebHomeItem, locale: string): string | null {
  if (!item.listing) return null;
  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 });
  return `${fmt.format(item.listing.price)} ${item.listing.price_unit ?? "EGP"}`;
}

export default async function WebHomePage() {
  const t = await getTranslations("storefront");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const supabase = await createClient();
  const data = await getWebHomeData(supabase);

  const hero = data.web_hero_slider;
  const categories = data.web_categories_strip;
  const flashDeals = data.web_flash_deals;
  const trending = data.web_trending;
  const promos = data.web_promo_banners;
  const suppliers = data.web_featured_suppliers;

  const heroSlides = hero?.items ?? [];
  const activeSlide = heroSlides[0]; // First slide always visible (server-rendered)

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="max-w-[1400px] mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* === LEFT COLUMN === */}
          <div className="space-y-4">

            {/* === HERO SLIDER === */}
            {activeSlide ? (
              <article className="rounded-2xl overflow-hidden bg-[#C62828] relative">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
                  <div className="p-8 md:p-10">
                    {pick(activeSlide.kicker_ar, activeSlide.kicker_en, locale) ? (
                      <div className="text-[11px] text-[#FFCA28] font-bold tracking-wider uppercase mb-2">
                        {pick(activeSlide.kicker_ar, activeSlide.kicker_en, locale)}
                      </div>
                    ) : null}
                    <h1 className="text-3xl md:text-[32px] font-bold text-white leading-tight tracking-tight mb-3">
                      {pick(activeSlide.title_ar, activeSlide.title_en, locale)}
                    </h1>
                    {pick(activeSlide.description_ar, activeSlide.description_en, locale) ? (
                      <p className="text-sm text-white/75 mb-6 max-w-md">
                        {pick(activeSlide.description_ar, activeSlide.description_en, locale)}
                      </p>
                    ) : null}
                    {pick(activeSlide.cta_label_ar, activeSlide.cta_label_en, locale) ? (
                      <div className="flex gap-2.5">
                        <Link
                          href={activeSlide.href}
                          className="bg-[#FFCA28] text-[#7B1A1A] px-6 py-2.5 rounded-xl text-sm font-bold inline-block"
                        >
                          {pick(activeSlide.cta_label_ar, activeSlide.cta_label_en, locale)}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                  <div className="hidden md:flex bg-[#B71C1C] items-center justify-center relative overflow-hidden">
                    {activeSlide.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeSlide.image_url}
                        alt=""
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <svg viewBox="0 0 200 200" className="w-56 h-56 opacity-25" aria-hidden>
                        <rect x="10" y="40" width="180" height="120" rx="14" fill="#fff" />
                        <rect x="30" y="20" width="140" height="90" rx="12" fill="#fff" />
                        <circle cx="100" cy="155" r="14" fill="#fff" />
                      </svg>
                    )}
                  </div>
                </div>
                {/* Dots (one per slide) */}
                {heroSlides.length > 1 ? (
                  <div className="flex justify-center gap-1.5 py-2.5 bg-[#B71C1C]">
                    {heroSlides.map((_, i) => (
                      <span
                        key={i}
                        className={i === 0 ? "w-4 h-1.5 bg-white rounded" : "w-1.5 h-1.5 bg-white/35 rounded-full"}
                      />
                    ))}
                  </div>
                ) : null}
                {/* Hero Stats */}
                <div className="grid grid-cols-3 bg-[#A01818] border-t border-white/10">
                  <div className="py-3.5 text-center border-r border-white/10">
                    <div className="text-xl font-bold text-[#FFCA28]">50K+</div>
                    <div className="text-[11px] text-white/60 mt-0.5">{t("statProducts")}</div>
                  </div>
                  <div className="py-3.5 text-center border-r border-white/10">
                    <div className="text-xl font-bold text-[#FFCA28]">3,200</div>
                    <div className="text-[11px] text-white/60 mt-0.5">{t("statSuppliers")}</div>
                  </div>
                  <div className="py-3.5 text-center">
                    <div className="text-xl font-bold text-[#FFCA28]">98%</div>
                    <div className="text-[11px] text-white/60 mt-0.5">{t("statOnTime")}</div>
                  </div>
                </div>
              </article>
            ) : null}

            {/* === CATEGORIES STRIP === */}
            {categories && categories.items.length > 0 ? (
              <section className="bg-white rounded-xl p-4 border border-[#ebebeb]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    {pick(categories.title_ar, categories.title_en, locale)}
                  </span>
                  <Link className="text-xs text-[#B71C1C] font-semibold" href="/gallery">
                    {tCommon("viewAll")} ›
                  </Link>
                </div>
                <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-1">
                  {categories.items.map((cat) => {
                    const href = cat.category_slug ? `/gallery?category=${encodeURIComponent(cat.category_slug)}` : cat.href;
                    return (
                      <Link
                        key={cat.id}
                        href={href}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0"
                      >
                        <div className="w-[62px] h-[62px] rounded-full p-[2.5px] bg-gradient-to-br from-[#B71C1C] via-[#FFCA28] to-[#B71C1C]">
                          <div className="w-full h-full rounded-full border-2.5 border-white flex items-center justify-center overflow-hidden">
                            <div
                              className="w-full h-full rounded-full flex items-center justify-center text-2xl overflow-hidden"
                              style={{ backgroundColor: cat.bg_color ?? "#F5F5F5", color: cat.fg_color ?? "#555" }}
                            >
                              {cat.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                cat.icon_emoji || "📦"
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#444] text-center max-w-16 leading-tight font-medium">
                          {pick(cat.title_ar, cat.title_en, locale)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* === FLASH DEALS === */}
            {flashDeals && flashDeals.items.length > 0 ? (
              <section className="bg-white rounded-xl p-4 border border-[#ebebeb]">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#B71C1C] rounded-xl flex items-center justify-center">
                      <FireIcon className="w-4 h-4 text-[#FFCA28]" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#1a1a1a]">
                        {pick(flashDeals.title_ar, flashDeals.title_en, locale)}
                      </div>
                      <div className="text-[11px] text-[#888]">
                        {pick(flashDeals.subtitle_ar, flashDeals.subtitle_en, locale)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <CountdownTimer />
                    <Link className="text-xs text-[#B71C1C] font-semibold" href="/gallery">
                      {tCommon("viewAll")} ›
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {flashDeals.items.slice(0, 8).map((deal) => {
                    const img = deal.image_url || (deal.listing?.images?.[0] ?? null);
                    const title = pick(deal.title_ar, deal.title_en, locale) || deal.listing?.title || "";
                    const priceLabel = itemPriceLabel(deal, locale);
                    const href = deal.listing_id ? `/listings/${deal.listing_id}` : deal.href;
                    return (
                      <Link
                        key={deal.id}
                        href={href}
                        className="bg-[#f9f9f9] rounded-xl overflow-hidden border border-[#ebebeb] hover:-translate-y-0.5 hover:shadow-md transition-all"
                      >
                        <div
                          className="h-24 flex items-center justify-center relative"
                          style={{ backgroundColor: deal.bg_color ?? "#FFF3E0" }}
                        >
                          {pick(deal.badge_label_ar, deal.badge_label_en, locale) ? (
                            <div className="absolute top-2 left-2 bg-[#B71C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {pick(deal.badge_label_ar, deal.badge_label_en, locale)}
                            </div>
                          ) : null}
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="p-2 relative">
                          <div className="text-xs text-[#222] leading-snug mb-1 line-clamp-2">{title}</div>
                          {priceLabel ? (
                            <div className="text-[15px] font-bold text-[#B71C1C] tabular-nums">{priceLabel}</div>
                          ) : null}
                          {deal.badge_count != null ? (
                            <>
                              <div className="h-1 bg-[#eee] rounded mt-1.5">
                                <div
                                  className="h-full bg-[#B71C1C] rounded"
                                  style={{ width: `${Math.min(deal.badge_count, 100)}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-[#B71C1C] mt-1 font-medium">
                                {deal.badge_count}% {t("claimed")}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* === TRENDING === */}
            {trending && trending.items.length > 0 ? (
              <section className="bg-white rounded-xl p-4 border border-[#ebebeb]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[17px] font-bold text-[#1a1a1a]">
                    {pick(trending.title_ar, trending.title_en, locale)}
                  </span>
                  <Link className="text-xs text-[#B71C1C] font-semibold" href="/gallery">
                    {tCommon("viewAll")} ›
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {trending.items.slice(0, 8).map((item) => {
                    const img = item.image_url || (item.listing?.images?.[0] ?? null);
                    const title = pick(item.title_ar, item.title_en, locale) || item.listing?.title || "";
                    const priceLabel = itemPriceLabel(item, locale);
                    const href = item.listing_id ? `/listings/${item.listing_id}` : item.href;
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="bg-white rounded-xl overflow-hidden border border-[#ebebeb] hover:-translate-y-0.5 hover:shadow-md transition-all block"
                      >
                        <div className="h-32 flex items-center justify-center relative bg-[#FFF3E0]">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs text-[#1a1a1a] leading-snug mb-1 line-clamp-2 font-medium">
                            {title}
                          </div>
                          {priceLabel ? (
                            <div className="text-[15px] font-bold text-[#B71C1C] tabular-nums">{priceLabel}</div>
                          ) : null}
                          {item.listing?.location ? (
                            <div className="text-[11px] text-[#888] mt-0.5 truncate">📍 {item.listing.location}</div>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* === PROMO BANNERS === */}
            {promos && promos.items.length > 0 ? (
              <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {promos.items.slice(0, 4).map((promo) => (
                  <Link
                    key={promo.id}
                    href={promo.href}
                    className="rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all block"
                    style={{ backgroundColor: promo.bg_color ?? "#B71C1C", color: promo.fg_color ?? "white" }}
                  >
                    {pick(promo.kicker_ar, promo.kicker_en, locale) ? (
                      <div className="text-[10px] font-bold tracking-wider uppercase mb-1 opacity-70">
                        {pick(promo.kicker_ar, promo.kicker_en, locale)}
                      </div>
                    ) : null}
                    <div className="text-sm font-bold leading-snug mb-2">
                      {pick(promo.title_ar, promo.title_en, locale)}
                    </div>
                    {pick(promo.cta_label_ar, promo.cta_label_en, locale) ? (
                      <div className="text-xs font-bold inline-flex items-center gap-0.5" style={{ color: "#FFCA28" }}>
                        {pick(promo.cta_label_ar, promo.cta_label_en, locale)} <ArrowRightIcon />
                      </div>
                    ) : null}
                  </Link>
                ))}
              </section>
            ) : null}

            {/* === FEATURED SUPPLIERS === */}
            {suppliers && suppliers.items.length > 0 ? (
              <section className="bg-white rounded-xl p-4 border border-[#ebebeb]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[17px] font-bold text-[#1a1a1a]">
                    {pick(suppliers.title_ar, suppliers.title_en, locale)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {suppliers.items.slice(0, 8).map((sup) => {
                    const name =
                      pick(sup.title_ar, sup.title_en, locale) ||
                      sup.supplier?.legal_company_name?.trim() ||
                      sup.supplier?.full_name ||
                      "";
                    const initials = name
                      .split(" ")
                      .map((p) => p.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const href = sup.supplier_id ? `/profile/${sup.supplier_id}` : sup.href;
                    return (
                      <Link
                        key={sup.id}
                        href={href}
                        className="bg-white rounded-xl p-3.5 border border-[#ebebeb] hover:shadow-md transition-all block"
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold mb-2.5 font-mono"
                          style={{ backgroundColor: sup.bg_color ?? "#FFF3E0", color: sup.fg_color ?? "#E65100" }}
                        >
                          {sup.supplier?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sup.supplier.avatar_url}
                              alt={name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#1a1a1a]">{name}</div>
                        {sup.supplier?.business_verification_status === "approved" ? (
                          <div className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded font-semibold inline-block mt-1">
                            ✓ {t("verified")}
                          </div>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {/* === RIGHT COLUMN (placeholder; can be a future section type) === */}
          <aside className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="text-sm font-bold text-[#1a1a1a] mb-2">{t("rfqSidebarTitle")}</div>
              <p className="text-xs text-[#666] mb-3">{t("rfqSidebarLead")}</p>
              <Link
                href="/rfq"
                className="block w-full text-center bg-[#B71C1C] text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                {t("postRfq")}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
