"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  saveMobileHomepageContent,
  saveMobileHomepageSections,
} from "@/lib/homepage/actions";
import type {
  BilingualText,
  FlashDealsContent,
  HeroContent,
  HomepageContent,
  MembershipContent,
  MobileHomepageConfig,
  PromoBannersContent,
  RFQContent,
  SectionConfig,
  SectionType,
} from "@/lib/homepage/types";
import { DEFAULT_CONTENT, DEFAULT_SECTIONS } from "@/lib/homepage/types";
import { BilingualTextInput } from "./bilingual-text-input";

interface Props {
  initialConfig: MobileHomepageConfig | null;
}

export function MobileHomepageEditor({ initialConfig }: Props) {
  const t = useTranslations("adminMobileHomepage");
  const tSections = useTranslations("mobileSections");

  // State
  const [sections, setSections] = useState<SectionConfig[]>(
    initialConfig?.sections ?? DEFAULT_SECTIONS
  );
  const [content, setContent] = useState<HomepageContent>(
    initialConfig?.content ?? DEFAULT_CONTENT
  );
  const [activeTab, setActiveTab] = useState<"sections" | "hero" | "flash" | "membership" | "promo" | "rfq">("sections");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Helper to update section order
  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];

    // Update order numbers
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });

    setSections(newSections);
  };

  // Toggle section enabled
  const toggleSection = (id: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Add new section
  const addSection = (type: SectionType) => {
    const newId = `${type}_${Date.now()}`;
    const newSection: SectionConfig = {
      id: newId,
      type,
      enabled: true,
      order: sections.length + 1,
      title: {
        ar: getSectionTitle(type, 'ar'),
        en: getSectionTitle(type, 'en')
      },
      customData: getDefaultCustomData(type)
    };
    
    const newSections = [...sections, newSection];
    // Update order numbers
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });
    
    setSections(newSections);
  };

  // Remove section
  const removeSection = (id: string) => {
    const newSections = sections.filter(s => s.id !== id);
    // Update order numbers
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });
    
    setSections(newSections);
  };

  // Helper to get section title by type and locale
  const getSectionTitle = (type: SectionType, locale: 'ar' | 'en'): string => {
    const titles = {
      listing_category: { ar: 'فئة الإعلانات', en: 'Listing Category' },
      data_chart: { ar: 'رسم بياني', en: 'Data Chart' },
      custom_content: { ar: 'محتوى مخصص', en: 'Custom Content' },
      stories: { ar: 'الفئات', en: 'Categories' },
      hero: { ar: 'بانر العرض', en: 'Hero Banner' },
      membership: { ar: 'بطاقة العضوية', en: 'Membership Card' },
      flash_deals: { ar: 'الصفقات السريعة', en: 'Flash Deals' },
      categories: { ar: 'شبكة الفئات', en: 'Categories Grid' },
      trending: { ar: 'المنتجات الرائجة', en: 'Trending Products' },
      promo_banners: { ar: 'لافتات ترويجية', en: 'Promo Banners' },
      suppliers: { ar: 'الموردون الرئيسيون', en: 'Top Suppliers' },
      rfq: { ar: 'نموذج طلب العرض', en: 'RFQ Form' },
      recent_orders: { ar: 'الطلبات الأخيرة', en: 'Recent Orders' }
    };
    return titles[type]?.[locale] || type;
  };

  // Helper to get default custom data for section type
  const getDefaultCustomData = (type: SectionType): any => {
    switch (type) {
      case 'listing_category':
        return { categorySlug: '', limit: 10 };
      case 'data_chart':
        return { chartType: 'bar', dataSource: 'sales', title: { ar: 'مخطط البيانات', en: 'Data Chart' } };
      case 'custom_content':
        return { content: { ar: '', en: '' }, backgroundColor: '#ffffff' };
      default:
        return {};
    }
  };

  // Save sections
  const handleSaveSections = async () => {
    setSaving(true);
    setMessage("");
    const result = await saveMobileHomepageSections(sections);
    setSaving(false);
    setMessage(result.success ? t("saved") : result.error || t("error"));
  };

  // Save content
  const handleSaveContent = async () => {
    setSaving(true);
    setMessage("");
    const result = await saveMobileHomepageContent(content);
    setSaving(false);
    setMessage(result.success ? t("saved") : result.error || t("error"));
  };

  // Update hero content
  const updateHero = (updates: Partial<HeroContent>) => {
    setContent({ ...content, hero: { ...content.hero, ...updates } });
  };

  // Update hero stats
  const updateHeroStats = (updates: Partial<HeroContent["stats"]>) => {
    setContent({
      ...content,
      hero: { ...content.hero, stats: { ...content.hero.stats, ...updates } },
    });
  };

  // Update flash deals
  const updateFlash = (updates: Partial<FlashDealsContent>) => {
    setContent({ ...content, flash_deals: { ...content.flash_deals, ...updates } });
  };

  // Update membership
  const updateMembership = (updates: Partial<MembershipContent>) => {
    setContent({ ...content, membership: { ...content.membership, ...updates } });
  };

  // Update membership perks
  const updateMembershipPerk = (index: number, updates: Partial<{ value: string; label: BilingualText }>) => {
    const newPerks = [...content.membership.perks];
    newPerks[index] = { ...newPerks[index], ...updates };
    setContent({
      ...content,
      membership: { ...content.membership, perks: newPerks },
    });
  };

  // Update promo card
  const updatePromoCard = (index: number, updates: Partial<PromoBannersContent["cards"][0]>) => {
    const newCards = [...content.promo_banners.cards];
    newCards[index] = { ...newCards[index], ...updates };
    setContent({
      ...content,
      promo_banners: { ...content.promo_banners, cards: newCards },
    });
  };

  // Update RFQ
  const updateRFQ = (updates: Partial<RFQContent>) => {
    setContent({ ...content, rfq: { ...content.rfq, ...updates } });
  };

  return (
    <div className="grid gap-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--admin-shell-border)] pb-4">
        {[
          { id: "sections", label: t("tabSections") },
          { id: "hero", label: t("tabHero") },
          { id: "flash", label: t("tabFlash") },
          { id: "membership", label: t("tabMembership") },
          { id: "promo", label: t("tabPromo") },
          { id: "rfq", label: t("tabRFQ") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-sm px-3 py-1.5 text-sm font-semibold ${
              activeTab === tab.id
                ? "bg-[var(--admin-brand)] text-white"
                : "bg-[var(--admin-card-bg)] text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-sm px-4 py-3 text-sm ${
            message.includes(t("saved"))
              ? "border border-green-400 bg-green-50 text-green-900"
              : "border border-red-400 bg-red-50 text-red-900"
          }`}
        >
          {message}
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("sectionsTitle")}
          </h2>
          <p className="mb-4 text-sm text-[var(--admin-text-secondary)]">{t("sectionsDesc")}</p>

          <div className="space-y-2">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] p-3"
                >
                  <span className="w-8 text-center text-sm font-semibold text-[var(--admin-text-secondary)]">
                    {section.order}
                  </span>
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                    className="h-4 w-4 rounded-sm border-[var(--admin-cell-border)]"
                  />
                  <span className="flex-1 text-sm font-semibold text-[var(--admin-text)]">
                    {section.title.en} / {section.title.ar}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSection(index, "up")}
                      disabled={index === 0}
                      className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-1 text-xs hover:bg-[var(--admin-zebra-odd)] disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSection(index, "down")}
                      disabled={index === sections.length - 1}
                      className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-2 py-1 text-xs hover:bg-[var(--admin-zebra-odd)] disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      disabled={sections.length <= 1}
                      className="rounded-sm border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 disabled:opacity-30"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 border-t border-[var(--admin-shell-border)] pt-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Add New Section</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addSection('listing_category')}
                className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-3 py-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
              >
                📋 Listing Category
              </button>
              <button
                onClick={() => addSection('data_chart')}
                className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-3 py-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
              >
                📊 Data Chart
              </button>
              <button
                onClick={() => addSection('custom_content')}
                className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-3 py-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
              >
                📝 Custom Content
              </button>
              <button
                onClick={() => addSection('stories')}
                className="rounded-sm border border-[var(--admin-cell-border)] bg-white px-3 py-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)]"
              >
                📱 Stories
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveSections}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveSections")}
          </button>
        </div>
      )}

      {/* Hero Tab */}
      {activeTab === "hero" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("heroTitle")}
          </h2>

          <div className="grid gap-4">
            <BilingualTextInput
              label={t("heroKicker")}
              value={content.hero.kicker}
              onChange={(value) => updateHero({ kicker: value })}
              placeholder={{ ar: "ابنِ بثقة", en: "BUILD WITH CONFIDENCE" }}
            />
            <BilingualTextInput
              label={t("heroTitleLabel")}
              value={content.hero.title}
              onChange={(value) => updateHero({ title: value })}
              placeholder={{ ar: "سوق البناء رقم #1 في مصر", en: "Egypt's #1 Construction Marketplace" }}
            />
            <BilingualTextInput
              label={t("heroSubtitle")}
              value={content.hero.subtitle}
              onChange={(value) => updateHero({ subtitle: value })}
              placeholder={{ ar: "مواد بناء عالية الجودة", en: "High-quality construction materials" }}
            />
            <BilingualTextInput
              label={t("browseDealsText")}
              value={content.hero.browseDealsText}
              onChange={(value) => updateHero({ browseDealsText: value })}
              placeholder={{ ar: "تصفح الصفقات", en: "Browse Deals" }}
            />
            <BilingualTextInput
              label={t("postRfqText")}
              value={content.hero.postRfqText}
              onChange={(value) => updateHero({ postRfqText: value })}
              placeholder={{ ar: "نشر طلب عرض", en: "Post RFQ" }}
            />

            <div className="border-t border-[var(--admin-shell-border)] pt-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">{t("heroStats")}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                    {t("statProducts")}
                  </label>
                  <input
                    type="text"
                    value={content.hero.stats.products}
                    onChange={(e) => updateHeroStats({ products: e.target.value })}
                    className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                    {t("statSuppliers")}
                  </label>
                  <input
                    type="text"
                    value={content.hero.stats.suppliers}
                    onChange={(e) => updateHeroStats({ suppliers: e.target.value })}
                    className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                    {t("statOnTime")}
                  </label>
                  <input
                    type="text"
                    value={content.hero.stats.onTime}
                    onChange={(e) => updateHeroStats({ onTime: e.target.value })}
                    className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveContent")}
          </button>
        </div>
      )}

      {/* Flash Deals Tab */}
      {activeTab === "flash" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("flashDealsTitle")}
          </h2>

          <div className="grid gap-4">
            <BilingualTextInput
              label={t("flashTitle")}
              value={content.flash_deals.title}
              onChange={(value) => updateFlash({ title: value })}
              placeholder={{ ar: "الصفقات السريعة", en: "Flash Deals" }}
            />
            <BilingualTextInput
              label={t("flashSubtitle")}
              value={content.flash_deals.subtitle}
              onChange={(value) => updateFlash({ subtitle: value })}
              placeholder={{ ar: "عروض محدودة الوقت", en: "Limited time offers" }}
            />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                  {t("timerHours")}
                </label>
                <input
                  type="number"
                  value={content.flash_deals.timerHours}
                  onChange={(e) => updateFlash({ timerHours: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                  {t("timerMinutes")}
                </label>
                <input
                  type="number"
                  value={content.flash_deals.timerMinutes}
                  onChange={(e) => updateFlash({ timerMinutes: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                  {t("timerSeconds")}
                </label>
                <input
                  type="number"
                  value={content.flash_deals.timerSeconds}
                  onChange={(e) => updateFlash({ timerSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveContent")}
          </button>
        </div>
      )}

      {/* Membership Tab */}
      {activeTab === "membership" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("membershipTitle")}
          </h2>

          <div className="grid gap-4">
            <BilingualTextInput
              label={t("memberKicker")}
              value={content.membership.kicker}
              onChange={(value) => updateMembership({ kicker: value })}
              placeholder={{ ar: "عضوية مميزة", en: "PREMIUM MEMBERSHIP" }}
            />
            <BilingualTextInput
              label={t("welcomeText")}
              value={content.membership.welcomeText}
              onChange={(value) => updateMembership({ welcomeText: value })}
              placeholder={{ ar: "مرحباً بعودتك", en: "Welcome Back" }}
            />
            <BilingualTextInput
              label={t("memberSubtitle")}
              value={content.membership.subtitle}
              onChange={(value) => updateMembership({ subtitle: value })}
              placeholder={{ ar: "استمتع بامتيازات حصرية", en: "Enjoy exclusive benefits" }}
            />
            <BilingualTextInput
              label={t("redeemButton")}
              value={content.membership.redeemButton}
              onChange={(value) => updateMembership({ redeemButton: value })}
              placeholder={{ ar: "استرداد", en: "Redeem" }}
            />

            <div className="border-t border-[var(--admin-shell-border)] pt-4">
              <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">{t("membershipPerks")}</h3>
              <div className="grid grid-cols-2 gap-4">
                {content.membership.perks.map((perk, index) => (
                  <div key={index} className="rounded-sm border border-[var(--admin-cell-border)] p-3">
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("perkValue")} {index + 1}
                    </label>
                    <input
                      type="text"
                      value={perk.value}
                      onChange={(e) => updateMembershipPerk(index, { value: e.target.value })}
                      className="mb-2 w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    />
                    <BilingualTextInput
                      label={`${t("perkLabel")} ${index + 1}`}
                      value={perk.label}
                      onChange={(value) => updateMembershipPerk(index, { label: value })}
                      placeholder={{ ar: "خصم خاص", en: "Special Discount" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveContent")}
          </button>
        </div>
      )}

      {/* Promo Banners Tab */}
      {activeTab === "promo" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("promoTitle")}
          </h2>

          <div className="grid gap-4">
            {content.promo_banners.cards.map((card, index) => (
              <div key={index} className="rounded-sm border border-[var(--admin-cell-border)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">
                  {t("promoCard")} {index + 1}
                </h3>
                <div className="grid gap-3">
                  <BilingualTextInput
                    label={t("promoKicker")}
                    value={card.kicker}
                    onChange={(value) => updatePromoCard(index, { kicker: value })}
                    placeholder={{ ar: "شحن مجاني", en: "FREE SHIPPING" }}
                  />
                  <BilingualTextInput
                    label={t("promoCardTitle")}
                    value={card.title}
                    onChange={(value) => updatePromoCard(index, { title: value })}
                    placeholder={{ ar: "على جميع الطلبات", en: "On All Orders" }}
                  />
                  <BilingualTextInput
                    label={t("promoCta")}
                    value={card.cta}
                    onChange={(value) => updatePromoCard(index, { cta: value })}
                    placeholder={{ ar: "اطلب الآن", en: "Claim Now" }}
                  />
                  <div>
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("promoLink")}
                    </label>
                    <input
                      type="text"
                      value={card.link}
                      onChange={(e) => updatePromoCard(index, { link: e.target.value })}
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("promoColor")}
                    </label>
                    <select
                      value={card.color}
                      onChange={(e) =>
                        updatePromoCard(index, { color: e.target.value as typeof card.color })
                      }
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    >
                      <option value="primary">{t("colorPrimary")}</option>
                      <option value="dark">{t("colorDark")}</option>
                      <option value="orange">{t("colorOrange")}</option>
                      <option value="green">{t("colorGreen")}</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveContent")}
          </button>
        </div>
      )}

      {/* RFQ Tab */}
      {activeTab === "rfq" && (
        <div className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] p-5">
          <h2 className="mb-4 text-base font-semibold text-[var(--admin-table-header-text)]">
            {t("rfqTitleLabel")}
          </h2>

          <div className="grid gap-4">
            <BilingualTextInput
              label={t("rfqTitle")}
              value={content.rfq.title}
              onChange={(value) => updateRFQ({ title: value })}
              placeholder={{ ar: "تحتاج مواد بناء؟", en: "Need Construction Materials?" }}
            />
            <BilingualTextInput
              label={t("rfqSubtitle")}
              value={content.rfq.subtitle}
              onChange={(value) => updateRFQ({ subtitle: value })}
              placeholder={{ ar: "احصل على عروض من موردين موثوقين", en: "Get quotes from trusted suppliers" }}
            />
            <BilingualTextInput
              label={t("rfqCta")}
              value={content.rfq.cta}
              onChange={(value) => updateRFQ({ cta: value })}
              placeholder={{ ar: "نشر طلب عرض", en: "Post RFQ" }}
            />
          </div>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="mt-4 rounded-sm border border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveContent")}
          </button>
        </div>
      )}
    </div>
  );
}
