"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  saveMobileHomepageContent,
  saveMobileHomepageSections,
} from "@/lib/homepage/actions";
import type {
  FlashDealsContent,
  HeroContent,
  HomepageContent,
  MembershipContent,
  MobileHomepageConfig,
  PromoBannersContent,
  RFQContent,
  SectionConfig,
} from "@/lib/homepage/types";
import { DEFAULT_CONTENT, DEFAULT_SECTIONS } from "@/lib/homepage/types";

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
  const updateMembershipPerk = (index: number, updates: Partial<{ value: string; label: string }>) => {
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
                    {tSections(section.id)}
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
                  </div>
                </div>
              ))}
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
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("heroKicker")} (i18n key)
              </label>
              <input
                type="text"
                value={content.hero.kicker}
                onChange={(e) => updateHero({ kicker: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("heroTitleLabel")} (i18n key)
              </label>
              <input
                type="text"
                value={content.hero.title}
                onChange={(e) => updateHero({ title: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("heroSubtitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.hero.subtitle}
                onChange={(e) => updateHero({ subtitle: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("browseDealsText")} (i18n key)
              </label>
              <input
                type="text"
                value={content.hero.browseDealsText}
                onChange={(e) => updateHero({ browseDealsText: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("postRfqText")} (i18n key)
              </label>
              <input
                type="text"
                value={content.hero.postRfqText}
                onChange={(e) => updateHero({ postRfqText: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>

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
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("flashTitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.flash_deals.title}
                onChange={(e) => updateFlash({ title: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("flashSubtitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.flash_deals.subtitle}
                onChange={(e) => updateFlash({ subtitle: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
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
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("memberKicker")} (i18n key)
              </label>
              <input
                type="text"
                value={content.membership.kicker}
                onChange={(e) => updateMembership({ kicker: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("welcomeText")} (i18n key)
              </label>
              <input
                type="text"
                value={content.membership.welcomeText}
                onChange={(e) => updateMembership({ welcomeText: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("memberSubtitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.membership.subtitle}
                onChange={(e) => updateMembership({ subtitle: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("redeemButton")} (i18n key)
              </label>
              <input
                type="text"
                value={content.membership.redeemButton}
                onChange={(e) => updateMembership({ redeemButton: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>

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
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("perkLabel")} {index + 1} (i18n key)
                    </label>
                    <input
                      type="text"
                      value={perk.label}
                      onChange={(e) => updateMembershipPerk(index, { label: e.target.value })}
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
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
                  <div>
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("promoKicker")} (i18n key)
                    </label>
                    <input
                      type="text"
                      value={card.kicker}
                      onChange={(e) => updatePromoCard(index, { kicker: e.target.value })}
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("promoCardTitle")} (i18n key)
                    </label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => updatePromoCard(index, { title: e.target.value })}
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--admin-text-secondary)]">
                      {t("promoCta")} (i18n key)
                    </label>
                    <input
                      type="text"
                      value={card.cta}
                      onChange={(e) => updatePromoCard(index, { cta: e.target.value })}
                      className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
                    />
                  </div>
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
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("rfqTitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.rfq.title}
                onChange={(e) => updateRFQ({ title: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("rfqSubtitle")} (i18n key)
              </label>
              <input
                type="text"
                value={content.rfq.subtitle}
                onChange={(e) => updateRFQ({ subtitle: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[var(--admin-text)]">
                {t("rfqCta")} (i18n key)
              </label>
              <input
                type="text"
                value={content.rfq.cta}
                onChange={(e) => updateRFQ({ cta: e.target.value })}
                className="w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm"
              />
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
    </div>
  );
}
