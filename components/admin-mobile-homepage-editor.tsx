"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { saveMobileHomepageConfig } from "@/lib/homepage/actions";
import { adminUi } from "@/lib/admin-ui";
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
import { SliderItemsEditor } from "./slider-items-editor";

const SECTION_ICONS: Record<string, string> = {
  stories: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z",
  hero: "M4 22V4M4 4h14l-3 5 3 5H4",
  membership: "M3 7h18v12H3zM3 11h18",
  flash_deals: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  categories: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  trending: "M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6",
  promo_banners: "M3 3h18v5H3zM3 11h8v10H3zM14 11h7v4h-7z",
  suppliers: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  rfq: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  recent_orders: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  listing_category: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  data_chart: "M18 20V10M12 20V4M6 20v-6",
  custom_content: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
  slider: "M3 3h18v5H3zM3 11h18v2H3zM3 17h18v4H3z",
};

const CONTENT_TYPES = new Set<SectionType>([
  "hero",
  "flash_deals",
  "membership",
  "promo_banners",
  "rfq",
  "listing_category",
  "data_chart",
  "custom_content",
  "slider",
]);

const ADD_OPTIONS: SectionType[] = [
  "slider",
  "listing_category",
  "custom_content",
  "data_chart",
  "stories",
  "hero",
  "membership",
  "flash_deals",
  "categories",
  "trending",
  "promo_banners",
  "suppliers",
  "rfq",
  "recent_orders",
];

const SECTION_TITLES: Record<SectionType, BilingualText> = {
  listing_category: { ar: "فئة الإعلانات", en: "Listing Category" },
  data_chart: { ar: "رسم بياني", en: "Data Chart" },
  custom_content: { ar: "محتوى مخصص", en: "Custom Content" },
  stories: { ar: "الفئات", en: "Category Stories" },
  hero: { ar: "بانر العرض", en: "Hero Banner" },
  membership: { ar: "بطاقة العضوية", en: "Membership Card" },
  flash_deals: { ar: "الصفقات السريعة", en: "Flash Deals" },
  categories: { ar: "شبكة الفئات", en: "Categories Grid" },
  trending: { ar: "المنتجات الرائجة", en: "Trending Products" },
  promo_banners: { ar: "لافتات ترويجية", en: "Promo Banners" },
  suppliers: { ar: "الموردون الرئيسيون", en: "Top Suppliers" },
  rfq: { ar: "نموذج طلب العرض", en: "RFQ Form" },
  recent_orders: { ar: "الطلبات الأخيرة", en: "Recent Orders" },
  slider: { ar: "شريط الإعلانات", en: "Promo Slider" },
};

type PresetId = "commerce" | "rfq_focus" | "minimal" | "default";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function reorder(list: SectionConfig[]): SectionConfig[] {
  return list.map((s, i) => ({ ...s, order: i + 1 }));
}

function defaultCustomData(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "listing_category":
      return { categorySlug: "", rows: 2 };
    case "data_chart":
      return { chartType: "bar", dataSource: "sales" };
    case "custom_content":
      return { content: { ar: "", en: "" }, backgroundColor: "#ffffff" };
    case "slider":
      return { items: [], autoPlay: true, interval: 3000, showDots: true, showArrows: false };
    default:
      return {};
  }
}

function applyPreset(id: PresetId): SectionConfig[] {
  const base = clone(DEFAULT_SECTIONS);
  if (id === "default") return reorder(base);

  if (id === "commerce") {
    base.forEach((s) => {
      s.enabled = ["stories", "hero", "flash_deals", "categories", "trending", "promo_banners", "suppliers", "rfq"].includes(s.type);
    });
  } else if (id === "rfq_focus") {
    base.forEach((s) => {
      s.enabled = ["hero", "rfq", "categories", "suppliers", "promo_banners"].includes(s.type);
    });
    const orderTypes: SectionType[] = ["hero", "rfq", "categories", "suppliers", "promo_banners", "stories", "membership", "flash_deals", "trending", "recent_orders"];
    base.sort((a, b) => orderTypes.indexOf(a.type) - orderTypes.indexOf(b.type));
  } else if (id === "minimal") {
    base.forEach((s) => {
      s.enabled = ["stories", "hero", "categories", "rfq"].includes(s.type);
    });
  }
  return reorder(base);
}

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

interface Props {
  initialConfig: MobileHomepageConfig | null;
}

export function MobileHomepageEditor({ initialConfig }: Props) {
  const t = useTranslations("adminMobileHomepage");

  const [sections, setSections] = useState<SectionConfig[]>(
    () => reorder(clone(initialConfig?.sections ?? DEFAULT_SECTIONS)),
  );
  const [content, setContent] = useState<HomepageContent>(
    () => clone(initialConfig?.content ?? DEFAULT_CONTENT),
  );
  const [savedSections, setSavedSections] = useState(() => clone(sections));
  const [savedContent, setSavedContent] = useState(() => clone(content));
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (initialConfig?.sections ?? DEFAULT_SECTIONS)[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "on" | "off">("all");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ slug: string; label_ar?: string; label_en?: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const dragSrc = useRef<string | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const isDirty =
    JSON.stringify(sections) !== JSON.stringify(savedSections) ||
    JSON.stringify(content) !== JSON.stringify(savedContent);

  const selected = sections.find((s) => s.id === selectedId) ?? null;
  const visibleCount = sections.filter((s) => s.enabled).length;

  const filtered = useMemo(() => {
    return sections.filter((s) => {
      if (filter === "on" && !s.enabled) return false;
      if (filter === "off" && s.enabled) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.title.en.toLowerCase().includes(q) ||
        s.title.ar.includes(search) ||
        s.type.includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [sections, filter, search]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const result = await saveMobileHomepageConfig(sections, content);
    setSaving(false);
    if (result.success) {
      setSavedSections(clone(sections));
      setSavedContent(clone(content));
      showToast(t("saved"));
    } else {
      showToast(result.error || t("error"));
    }
  }, [sections, content, saving, t]);

  saveRef.current = handleSave;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateSection = (id: string, patch: Partial<SectionConfig>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const updateCustomData = (id: string, customData: unknown) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, customData } : s)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sections.length) return;
    setSections((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return reorder(copy);
    });
  };

  const onDrop = (targetId: string) => {
    const from = dragSrc.current;
    if (!from || from === targetId) return;
    setSections((prev) => {
      const copy = [...prev];
      const fi = copy.findIndex((x) => x.id === from);
      const ti = copy.findIndex((x) => x.id === targetId);
      if (fi < 0 || ti < 0) return prev;
      const [moved] = copy.splice(fi, 1);
      copy.splice(ti, 0, moved);
      return reorder(copy);
    });
    dragSrc.current = null;
  };

  const addSection = (type: SectionType) => {
    const id = `${type}_${Date.now()}`;
    const section: SectionConfig = {
      id,
      type,
      enabled: true,
      order: sections.length + 1,
      title: { ...SECTION_TITLES[type] },
      customData: defaultCustomData(type),
    };
    setSections((prev) => reorder([...prev, section]));
    setSelectedId(id);
    setAddOpen(false);
  };

  const removeSection = (id: string) => {
    if (!confirm(t("confirmRemove"))) return;
    setSections((prev) => {
      const next = reorder(prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const duplicateSection = (id: string) => {
    const src = sections.find((s) => s.id === id);
    if (!src) return;
    const copy: SectionConfig = {
      ...clone(src),
      id: `${src.type}_${Date.now()}`,
      title: {
        ar: `${src.title.ar} (نسخة)`,
        en: `${src.title.en} (copy)`,
      },
    };
    const idx = sections.findIndex((s) => s.id === id);
    setSections((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return reorder(next);
    });
    setSelectedId(copy.id);
  };

  const handleDiscard = () => {
    setSections(clone(savedSections));
    setContent(clone(savedContent));
    showToast(t("discarded"));
  };

  const handlePreset = (id: PresetId) => {
    if (isDirty && !confirm(t("confirmPreset"))) return;
    const next = applyPreset(id);
    setSections(next);
    setSelectedId(next.find((s) => s.enabled)?.id ?? next[0]?.id ?? null);
  };

  const handleResetDefaults = () => {
    if (!confirm(t("confirmReset"))) return;
    setSections(reorder(clone(DEFAULT_SECTIONS)));
    setContent(clone(DEFAULT_CONTENT));
    setSelectedId(DEFAULT_SECTIONS[0]?.id ?? null);
  };

  const updateHero = (u: Partial<HeroContent>) =>
    setContent((c) => ({ ...c, hero: { ...c.hero, ...u } }));
  const updateHeroStats = (u: Partial<HeroContent["stats"]>) =>
    setContent((c) => ({ ...c, hero: { ...c.hero, stats: { ...c.hero.stats, ...u } } }));
  const updateFlash = (u: Partial<FlashDealsContent>) =>
    setContent((c) => ({ ...c, flash_deals: { ...c.flash_deals, ...u } }));
  const updateMembership = (u: Partial<MembershipContent>) =>
    setContent((c) => ({ ...c, membership: { ...c.membership, ...u } }));
  const updateMembershipPerk = (i: number, u: Partial<{ value: string; label: BilingualText }>) => {
    const perks = [...content.membership.perks];
    perks[i] = { ...perks[i], ...u };
    setContent((c) => ({ ...c, membership: { ...c.membership, perks } }));
  };
  const updatePromoCard = (i: number, u: Partial<PromoBannersContent["cards"][0]>) => {
    const cards = [...content.promo_banners.cards];
    cards[i] = { ...cards[i], ...u };
    setContent((c) => ({ ...c, promo_banners: { ...c.promo_banners, cards } }));
  };
  const updateRFQ = (u: Partial<RFQContent>) =>
    setContent((c) => ({ ...c, rfq: { ...c.rfq, ...u } }));

  const field =
    "w-full rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-field-bg)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)]";
  const label = "text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]";

  const renderContentEditor = (section: SectionConfig) => {
    switch (section.type) {
      case "hero":
        return (
          <div className="flex flex-col gap-4">
            <BilingualTextInput label={t("heroKicker")} value={content.hero.kicker} onChange={(v) => updateHero({ kicker: v })} />
            <BilingualTextInput label={t("heroTitleLabel")} value={content.hero.title} onChange={(v) => updateHero({ title: v })} />
            <BilingualTextInput label={t("heroSubtitle")} value={content.hero.subtitle} onChange={(v) => updateHero({ subtitle: v })} />
            <BilingualTextInput label={t("browseDealsText")} value={content.hero.browseDealsText} onChange={(v) => updateHero({ browseDealsText: v })} />
            <BilingualTextInput label={t("postRfqText")} value={content.hero.postRfqText} onChange={(v) => updateHero({ postRfqText: v })} />
            <div>
              <h4 className={adminUi.sectionTitle}>{t("heroStats")}</h4>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {([
                  ["statProducts", "products", content.hero.stats.products],
                  ["statSuppliers", "suppliers", content.hero.stats.suppliers],
                  ["statOnTime", "onTime", content.hero.stats.onTime],
                ] as const).map(([lk, key, val]) => (
                  <label key={key} className="flex flex-col gap-1">
                    <span className={label}>{t(lk)}</span>
                    <input className={field} value={val} onChange={(e) => updateHeroStats({ [key]: e.target.value } as Partial<HeroContent["stats"]>)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case "flash_deals":
        return (
          <div className="flex flex-col gap-4">
            <BilingualTextInput label={t("flashTitle")} value={content.flash_deals.title} onChange={(v) => updateFlash({ title: v })} />
            <BilingualTextInput label={t("flashSubtitle")} value={content.flash_deals.subtitle} onChange={(v) => updateFlash({ subtitle: v })} />
            <div className="grid grid-cols-3 gap-3">
              {([
                ["timerHours", "timerHours", content.flash_deals.timerHours],
                ["timerMinutes", "timerMinutes", content.flash_deals.timerMinutes],
                ["timerSeconds", "timerSeconds", content.flash_deals.timerSeconds],
              ] as const).map(([lk, key, val]) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className={label}>{t(lk)}</span>
                  <input
                    type="number"
                    min={0}
                    className={field}
                    value={val}
                    onChange={(e) => updateFlash({ [key]: parseInt(e.target.value, 10) || 0 } as Partial<FlashDealsContent>)}
                  />
                </label>
              ))}
            </div>
          </div>
        );
      case "membership":
        return (
          <div className="flex flex-col gap-4">
            <BilingualTextInput label={t("memberKicker")} value={content.membership.kicker} onChange={(v) => updateMembership({ kicker: v })} />
            <BilingualTextInput label={t("welcomeText")} value={content.membership.welcomeText} onChange={(v) => updateMembership({ welcomeText: v })} />
            <BilingualTextInput label={t("memberSubtitle")} value={content.membership.subtitle} onChange={(v) => updateMembership({ subtitle: v })} />
            <BilingualTextInput label={t("redeemButton")} value={content.membership.redeemButton} onChange={(v) => updateMembership({ redeemButton: v })} />
            <div>
              <h4 className={adminUi.sectionTitle}>{t("membershipPerks")}</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {content.membership.perks.map((perk, i) => (
                  <div key={i} className="rounded-sm border border-[var(--admin-cell-border)] p-3">
                    <label className="flex flex-col gap-1">
                      <span className={label}>{t("perkValue")} {i + 1}</span>
                      <input className={field} value={perk.value} onChange={(e) => updateMembershipPerk(i, { value: e.target.value })} />
                    </label>
                    <div className="mt-2">
                      <BilingualTextInput label={`${t("perkLabel")} ${i + 1}`} value={perk.label} onChange={(v) => updateMembershipPerk(i, { label: v })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "promo_banners":
        return (
          <div className="flex flex-col gap-4">
            {content.promo_banners.cards.map((card, i) => (
              <div key={i} className="rounded-sm border border-[var(--admin-cell-border)] p-4">
                <h4 className="mb-3 text-sm font-semibold">{t("promoCard")} {i + 1}</h4>
                <div className="flex flex-col gap-3">
                  <BilingualTextInput label={t("promoKicker")} value={card.kicker} onChange={(v) => updatePromoCard(i, { kicker: v })} />
                  <BilingualTextInput label={t("promoCardTitle")} value={card.title} onChange={(v) => updatePromoCard(i, { title: v })} />
                  <BilingualTextInput label={t("promoCta")} value={card.cta} onChange={(v) => updatePromoCard(i, { cta: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className={label}>{t("promoLink")}</span>
                      <input className={field} value={card.link} onChange={(e) => updatePromoCard(i, { link: e.target.value })} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={label}>{t("promoColor")}</span>
                      <select className={field} value={card.color} onChange={(e) => updatePromoCard(i, { color: e.target.value as typeof card.color })}>
                        <option value="primary">{t("colorPrimary")}</option>
                        <option value="dark">{t("colorDark")}</option>
                        <option value="orange">{t("colorOrange")}</option>
                        <option value="green">{t("colorGreen")}</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case "rfq":
        return (
          <div className="flex flex-col gap-4">
            <BilingualTextInput label={t("rfqTitle")} value={content.rfq.title} onChange={(v) => updateRFQ({ title: v })} />
            <BilingualTextInput label={t("rfqSubtitle")} value={content.rfq.subtitle} onChange={(v) => updateRFQ({ subtitle: v })} />
            <BilingualTextInput label={t("rfqCta")} value={content.rfq.cta} onChange={(v) => updateRFQ({ cta: v })} />
          </div>
        );
      case "listing_category":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={label}>{t("fieldCategory")}</span>
              <select
                className={field}
                value={section.customData?.categorySlug || ""}
                disabled={loadingCategories}
                onChange={(e) => updateCustomData(section.id, { ...section.customData, categorySlug: e.target.value })}
              >
                <option value="">{loadingCategories ? t("loading") : t("selectCategory")}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label_ar} / {c.label_en}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t("fieldRows")}</span>
              <input
                type="number"
                min={1}
                max={10}
                className={field}
                value={section.customData?.rows || 2}
                onChange={(e) => updateCustomData(section.id, { ...section.customData, rows: parseInt(e.target.value, 10) || 2 })}
              />
            </label>
          </div>
        );
      case "data_chart":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={label}>{t("fieldChartType")}</span>
              <select
                className={field}
                value={section.customData?.chartType || "bar"}
                onChange={(e) => updateCustomData(section.id, { ...section.customData, chartType: e.target.value })}
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
                <option value="area">Area</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t("fieldDataSource")}</span>
              <select
                className={field}
                value={section.customData?.dataSource || "sales"}
                onChange={(e) => updateCustomData(section.id, { ...section.customData, dataSource: e.target.value })}
              >
                <option value="sales">Sales</option>
                <option value="products">Products</option>
                <option value="suppliers">Suppliers</option>
                <option value="rfqs">RFQs</option>
              </select>
            </label>
          </div>
        );
      case "custom_content":
        return (
          <div className="flex flex-col gap-3">
            <BilingualTextInput
              label={t("fieldCustomContent")}
              value={section.customData?.content || { ar: "", en: "" }}
              onChange={(v) => updateCustomData(section.id, { ...section.customData, content: v })}
            />
            <label className="flex flex-col gap-1">
              <span className={label}>{t("fieldBackground")}</span>
              <input
                type="color"
                className={`${field} h-10 p-1`}
                value={section.customData?.backgroundColor || "#ffffff"}
                onChange={(e) => updateCustomData(section.id, { ...section.customData, backgroundColor: e.target.value })}
              />
            </label>
          </div>
        );
      case "slider":
        return (
          <div className="flex flex-col gap-3">
            <SliderItemsEditor
              items={section.customData?.items || []}
              onChange={(items) => updateCustomData(section.id, { ...section.customData, items })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className={label}>{t("fieldAutoPlay")}</span>
                <select
                  className={field}
                  value={section.customData?.autoPlay ? "true" : "false"}
                  onChange={(e) => updateCustomData(section.id, { ...section.customData, autoPlay: e.target.value === "true" })}
                >
                  <option value="true">{t("enabled")}</option>
                  <option value="false">{t("disabled")}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={label}>{t("fieldInterval")}</span>
                <input
                  type="number"
                  min={1000}
                  max={15000}
                  step={500}
                  className={field}
                  value={section.customData?.interval || 3000}
                  onChange={(e) => updateCustomData(section.id, { ...section.customData, interval: parseInt(e.target.value, 10) || 3000 })}
                />
              </label>
            </div>
          </div>
        );
      default:
        return (
          <div className={adminUi.messageStripInfo}>
            <p className="text-sm">{t("noInlineContent")}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className={adminUi.kpiNeutral}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">{t("kpiSections")}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--admin-table-header-text)]">{sections.length}</div>
        </div>
        <div className={adminUi.kpiAccent}>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">{t("kpiVisible")}</div>
          <div className="mt-1 text-2xl font-bold text-white">{visibleCount}</div>
        </div>
        <div className={adminUi.kpiNeutral}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">{t("kpiHidden")}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--admin-table-header-text)]">{sections.length - visibleCount}</div>
        </div>
        <div className={adminUi.kpiNeutral}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">{t("kpiStatus")}</div>
          <div className="mt-1 text-sm font-bold text-[var(--admin-table-header-text)]">
            {isDirty ? t("statusDraft") : t("statusSynced")}
          </div>
        </div>
      </div>

      <div className={`${adminUi.card} flex flex-wrap items-center gap-2 p-3`}>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["commerce", t("presetCommerce")],
            ["rfq_focus", t("presetRfq")],
            ["minimal", t("presetMinimal")],
            ["default", t("presetDefault")],
          ] as const).map(([id, labelText]) => (
            <button key={id} type="button" className={adminUi.btnGhost} onClick={() => handlePreset(id)}>
              {labelText}
            </button>
          ))}
        </div>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <button type="button" className={adminUi.btnSecondary} onClick={handleResetDefaults}>
            {t("resetDefaults")}
          </button>
          <button type="button" className={adminUi.btnSecondary} disabled={!isDirty || saving} onClick={handleDiscard}>
            {t("discard")}
          </button>
          <button type="button" className={adminUi.btnPrimary} disabled={!isDirty || saving} onClick={() => void handleSave()}>
            {saving ? t("saving") : t("saveAll")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(240px,280px)]">
        <section className={`${adminUi.card} flex min-h-[28rem] flex-col overflow-hidden`}>
          <div className="border-b border-[var(--admin-cell-border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className={adminUi.sectionTitle}>{t("stackTitle")}</h2>
              <button type="button" className={adminUi.btnPrimary} onClick={() => setAddOpen((v) => !v)}>
                {addOpen ? t("closeAdd") : t("addSection")}
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">{t("stackLead")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className={`${field} min-w-[10rem] flex-1`}
                placeholder={t("searchSections")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex gap-1">
                {([
                  ["all", t("filterAll")],
                  ["on", t("filterVisible")],
                  ["off", t("filterHidden")],
                ] as const).map(([key, lab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={filter === key ? adminUi.btnPrimary : adminUi.btnGhost}
                  >
                    {lab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {addOpen && (
            <div className="border-b border-[var(--admin-cell-border)] bg-[var(--admin-zebra-odd)] p-3">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--admin-text-secondary)]">{t("addNewSection")}</div>
              <div className="grid grid-cols-2 gap-2">
                {ADD_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addSection(type)}
                    className="flex items-center gap-2 rounded-sm border border-dashed border-[var(--admin-cell-border)] bg-[var(--admin-card-bg)] px-2 py-2 text-start text-xs font-semibold text-[var(--admin-text)] hover:border-[var(--admin-brand)]"
                  >
                    <Icon d={SECTION_ICONS[type] || SECTION_ICONS.custom_content} />
                    <span className="line-clamp-2">{SECTION_TITLES[type].en}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-[var(--admin-text-secondary)]">{t("noResults")}</div>
            )}
            {filtered.map((section) => {
              const realIdx = sections.findIndex((x) => x.id === section.id);
              const active = selectedId === section.id;
              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => {
                    dragSrc.current = section.id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(section.id)}
                  onClick={() => setSelectedId(section.id)}
                  className={`flex cursor-pointer items-start gap-2 rounded-sm border px-2 py-2 transition ${
                    active
                      ? "border-[var(--admin-brand)] bg-[var(--admin-brand)]/5 ring-1 ring-[var(--admin-brand)]"
                      : "border-[var(--admin-cell-border)] bg-[var(--admin-card-bg)] hover:bg-[var(--admin-zebra-odd)]"
                  } ${section.enabled ? "" : "opacity-60"}`}
                >
                  <span className="mt-1 cursor-grab text-[var(--admin-text-secondary)]" title={t("dragHint")}>
                    ⋮⋮
                  </span>
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[var(--admin-zebra-odd)] text-[var(--admin-brand)]">
                    <Icon d={SECTION_ICONS[section.type] || SECTION_ICONS.custom_content} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-[var(--admin-text)]">{section.title.en}</span>
                      <span className="truncate text-xs text-[var(--admin-text-secondary)]">/ {section.title.ar}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--admin-text-secondary)]">
                      <span className={adminUi.code}>#{realIdx + 1}</span>
                      <span className={adminUi.code}>{section.type}</span>
                      <span>{section.enabled ? t("visibleOnHomepage") : t("hiddenFromUsers")}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={section.enabled}
                      aria-label={section.enabled ? t("disable") : t("enable")}
                      onClick={() => updateSection(section.id, { enabled: !section.enabled })}
                      className={`relative h-5 w-9 rounded-full transition ${section.enabled ? "bg-emerald-600" : "bg-[var(--admin-cell-border)]"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${section.enabled ? "start-4" : "start-0.5"}`} />
                    </button>
                    <div className="flex gap-0.5">
                      <button type="button" className={adminUi.btnGhost} disabled={realIdx === 0} onClick={() => move(realIdx, -1)} title={t("moveUp")}>↑</button>
                      <button type="button" className={adminUi.btnGhost} disabled={realIdx === sections.length - 1} onClick={() => move(realIdx, 1)} title={t("moveDown")}>↓</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={`${adminUi.card} min-h-[28rem] overflow-hidden`}>
          {!selected ? (
            <div className="flex h-full items-center justify-center p-8 text-sm text-[var(--admin-text-secondary)]">
              {t("selectSectionHint")}
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-cell-border)] p-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">{t("inspector")}</div>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--admin-table-header-text)]">
                    {selected.title.en}
                    <span className="ms-2 text-sm font-normal text-[var(--admin-text-secondary)]">{selected.title.ar}</span>
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={adminUi.code}>{selected.type}</span>
                    <span className={adminUi.code}>{selected.id}</span>
                    {CONTENT_TYPES.has(selected.type) ? (
                      <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">{t("badgeEditable")}</span>
                    ) : (
                      <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">{t("badgeLayout")}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className={adminUi.btnSecondary} onClick={() => duplicateSection(selected.id)}>{t("duplicate")}</button>
                  <button type="button" className={adminUi.btnDanger} onClick={() => removeSection(selected.id)}>{t("remove")}</button>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className={label}>{t("titleEn")}</span>
                    <input
                      className={field}
                      value={selected.title.en}
                      onChange={(e) => updateSection(selected.id, { title: { ...selected.title, en: e.target.value } })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={label}>{t("titleAr")}</span>
                    <input
                      className={field}
                      dir="rtl"
                      value={selected.title.ar}
                      onChange={(e) => updateSection(selected.id, { title: { ...selected.title, ar: e.target.value } })}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--admin-text)]">
                  <input
                    type="checkbox"
                    className={adminUi.checkbox}
                    checked={selected.enabled}
                    onChange={(e) => updateSection(selected.id, { enabled: e.target.checked })}
                  />
                  {t("showOnMobileHome")}
                </label>

                <div>
                  <h3 className={adminUi.sectionTitle}>{t("sectionContent")}</h3>
                  <p className={adminUi.sectionLead}>{t("sectionContentLead")}</p>
                  <div className="mt-3">{renderContentEditor(selected)}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className={`${adminUi.card} sticky top-20 h-fit p-4`}>
          <h2 className={adminUi.sectionTitle}>{t("previewTitle")}</h2>
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">{t("previewLead")}</p>
          <div className="mx-auto mt-4 w-[220px] rounded-[1.6rem] border-[6px] border-zinc-800 bg-zinc-900 p-2 shadow-xl">
            <div className="mb-2 flex justify-center">
              <div className="h-1.5 w-16 rounded-full bg-zinc-700" />
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-[1rem] bg-[#f2f2f7]">
              <div className="bg-[var(--bina-primary)] px-3 py-2 text-center text-[10px] font-bold text-white">
                {t("previewHeader")}
              </div>
              {sections.filter((s) => s.enabled).length === 0 ? (
                <div className="p-4 text-center text-[11px] text-zinc-500">{t("previewEmpty")}</div>
              ) : (
                sections
                  .filter((s) => s.enabled)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={`flex w-full items-center gap-2 border-b border-zinc-200 px-2.5 py-2 text-start transition ${
                        selectedId === s.id ? "bg-white ring-2 ring-inset ring-[var(--admin-brand)]" : "bg-white/80 hover:bg-white"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-red-50 text-[var(--bina-primary)]">
                        <Icon d={SECTION_ICONS[s.type] || SECTION_ICONS.custom_content} className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-zinc-800">{s.title.en}</span>
                        <span className="block truncate text-[10px] text-zinc-500">{s.type}</span>
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className={`${adminUi.btnSecondary} mt-4 w-full`}>
            {t("openLivePreview")}
          </a>
        </aside>
      </div>

      <div
        className={`fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-2xl transition ${
          isDirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-16 opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {t("unsavedChanges")}
        </span>
        <button type="button" disabled={saving} onClick={handleDiscard} className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200">
          {t("discard")}
        </button>
        <button type="button" disabled={saving} onClick={() => void handleSave()} className="rounded-md bg-[var(--admin-brand)] px-3 py-1.5 text-xs font-bold text-white">
          {saving ? t("saving") : t("saveAll")}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[201] -translate-x-1/2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
