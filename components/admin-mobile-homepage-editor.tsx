"use client";

import { useState, useEffect, useRef } from "react";
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
import { SliderItemsEditor } from "./slider-items-editor";

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#F7F8FA", surface: "#FFFFFF", border: "#E4E7EC", borderStrong: "#CBD2DC",
  text: "#101828", textMuted: "#667085", textFaint: "#98A2B3",
  primary: "#4F46E5", primaryDark: "#4338CA", primarySoft: "#EEF1FF", primaryBorder: "#C7D2FE",
  success: "#079455", danger: "#D92D20", warning: "#DC6803", warningSoft: "#FFFAEB",
};

function IconDrag() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      {[6,12,18].map(y => [9,15].map(x => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={C.textFaint} />
      )))}
    </svg>
  );
}

const SECTION_ICONS: Record<string, string> = {
  stories: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z",
  hero: "M4 22V4M4 4h14l-3 5 3 5H4",
  membership: "M3 7h18v12H3zM3 11h18",
  flash_deals: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  categories: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  trending: "M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6",
  promo_banners: "M3 3h18v5H3zM3 11h8v10H3zM14 11h7v4h-7zM14 18h7v3h-7z",
  suppliers: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  rfq: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
  recent_orders: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  listing_category: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  data_chart: "M18 20V10M12 20V4M6 20v-6",
  custom_content: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  slider: "M3 3h18v5H3zM3 11h18v2H3zM3 17h18v4H3z",
};

const CORE_IDS = new Set(DEFAULT_SECTIONS.map(s => s.id));
const CONFIGURABLE_TYPES = new Set<SectionType>(["listing_category", "data_chart", "custom_content", "slider"]);

const ADD_OPTIONS: { type: SectionType; label: string; iconPath: string }[] = [
  { type: "listing_category", label: "Listing Category", iconPath: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { type: "data_chart",       label: "Data Chart",       iconPath: "M18 20V10M12 20V4M6 20v-6" },
  { type: "custom_content",   label: "Custom Content",   iconPath: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" },
  { type: "slider",           label: "Slider",           iconPath: "M3 3h18v5H3zM3 11h18v2H3z" },
  { type: "stories",          label: "Stories",          iconPath: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" },
];

const SECTION_TITLES: Record<SectionType, { ar: string; en: string }> = {
  listing_category: { ar: "فئة الإعلانات", en: "Listing Category" },
  data_chart:       { ar: "رسم بياني",     en: "Data Chart" },
  custom_content:   { ar: "محتوى مخصص",    en: "Custom Content" },
  stories:          { ar: "الفئات",         en: "Categories" },
  hero:             { ar: "بانر العرض",     en: "Hero Banner" },
  membership:       { ar: "بطاقة العضوية", en: "Membership Card" },
  flash_deals:      { ar: "الصفقات السريعة", en: "Flash Deals" },
  categories:       { ar: "شبكة الفئات",   en: "Categories Grid" },
  trending:         { ar: "المنتجات الرائجة", en: "Trending Products" },
  promo_banners:    { ar: "لافتات ترويجية", en: "Promo Banners" },
  suppliers:        { ar: "الموردون الرئيسيون", en: "Top Suppliers" },
  rfq:              { ar: "نموذج طلب العرض", en: "RFQ Form" },
  recent_orders:    { ar: "الطلبات الأخيرة", en: "Recent Orders" },
  slider:           { ar: "شريط الإعلانات", en: "Promo Slider" },
};

interface Props {
  initialConfig: MobileHomepageConfig | null;
}

export function MobileHomepageEditor({ initialConfig }: Props) {
  const t = useTranslations("adminMobileHomepage");

  // ── State ──────────────────────────────────────────────────────────────────
  const [sections, setSections] = useState<SectionConfig[]>(
    initialConfig?.sections ?? DEFAULT_SECTIONS
  );
  const [content, setContent] = useState<HomepageContent>(
    initialConfig?.content ?? DEFAULT_CONTENT
  );
  const [activeTab, setActiveTab] = useState<"sections" | "hero" | "flash" | "membership" | "promo" | "rfq">("sections");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<SectionConfig[]>(
    () => JSON.parse(JSON.stringify(initialConfig?.sections ?? DEFAULT_SECTIONS))
  );
  const [savedContent, setSavedContent] = useState<HomepageContent>(
    () => JSON.parse(JSON.stringify(initialConfig?.content ?? DEFAULT_CONTENT))
  );
  const dragSrcId = useRef<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const isDirty =
    JSON.stringify(sections) !== JSON.stringify(savedSections) ||
    JSON.stringify(content) !== JSON.stringify(savedContent);

  const visibleCount = sections.filter(s => s.enabled).length;
  const hiddenCount  = sections.length - visibleCount;

  const filtered = sections.filter(s => {
    if (statusFilter === "visible" && !s.enabled) return false;
    if (statusFilter === "hidden"  &&  s.enabled) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.title.en.toLowerCase().includes(q) || s.title.ar.includes(searchTerm);
    }
    return true;
  });

  // ── Fetch categories ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.ok ? r.json() : [])
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // ── Section mutations ───────────────────────────────────────────────────────
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

  // ── Section mutations ────────────────────────────────────────────────────────
  const toggleSection = (id: string) => {
    if (CORE_IDS.has(id)) return;
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const removeSection = (id: string) => {
    if (CORE_IDS.has(id)) return;
    if (!confirm("Remove this section from the homepage?")) return;
    setSections(prev => {
      const next = prev.filter(s => s.id !== id);
      next.forEach((s, i) => { s.order = i + 1; });
      return next;
    });
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const duplicateSection = (id: string) => {
    const src = sections.find(x => x.id === id);
    if (!src) return;
    const copy: SectionConfig = { ...JSON.parse(JSON.stringify(src)), id: `${src.type}_${Date.now()}` };
    const idx = sections.findIndex(x => x.id === id);
    setSections(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      next.forEach((s, i) => { s.order = i + 1; });
      return next;
    });
  };

  const addSection = (type: SectionType) => {
    const newId = `${type}_${Date.now()}`;
    const defaultData: Record<string, any> = {
      listing_category: { categorySlug: "", rows: 2 },
      data_chart: { chartType: "bar", dataSource: "sales" },
      custom_content: { content: { ar: "", en: "" }, backgroundColor: "#ffffff" },
      slider: { items: [], autoPlay: true, interval: 3000, showDots: true, showArrows: false },
    };
    const newSection: SectionConfig = {
      id: newId, type, enabled: true, order: sections.length + 1,
      title: SECTION_TITLES[type], customData: defaultData[type] ?? {},
    };
    setSections(prev => {
      const next = [...prev, newSection];
      next.forEach((s, i) => { s.order = i + 1; });
      return next;
    });
    setExpandedId(newId);
    setTimeout(() => {
      document.querySelector(`[data-sid="${newId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const updateSectionCustomData = (sectionId: string, customData: any) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, customData } : s));
  };

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const bulkSetVisible = (val: boolean) => {
    setSections(prev => prev.map(s => selected.has(s.id) && !CORE_IDS.has(s.id) ? { ...s, enabled: val } : s));
    setSelected(new Set());
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const onDragStart = (id: string) => { dragSrcId.current = id; };
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop      = (id: string) => {
    const from = dragSrcId.current;
    if (!from || from === id) return;
    setSections(prev => {
      const next = [...prev];
      const fi = next.findIndex(x => x.id === from);
      const ti = next.findIndex(x => x.id === id);
      const [moved] = next.splice(fi, 1);
      next.splice(ti, 0, moved);
      next.forEach((s, i) => { s.order = i + 1; });
      return next;
    });
    dragSrcId.current = null;
  };

  // ── Inline section settings panel ────────────────────────────────────────────
  const iStyle: React.CSSProperties = { border: `1px solid ${C.borderStrong}`, borderRadius: 7, padding: "6px 8px", fontSize: 12.5, background: "#fff", color: C.text, width: "100%", outline: "none" };
  const lStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.4px" };

  const renderSectionEditor = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;

    switch (section.type) {
      case "listing_category": return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={lStyle}>Category</label>
            <select style={iStyle} value={section.customData?.categorySlug || ""} disabled={loadingCategories}
              onChange={e => updateSectionCustomData(sectionId, { ...section.customData, categorySlug: e.target.value })}>
              <option value="">{loadingCategories ? "Loading..." : "Select category"}</option>
              {categories.map((c: any) => <option key={c.slug} value={c.slug}>{c.label_ar} / {c.label_en}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={lStyle}>Rows</label>
            <input type="number" min={1} max={10} style={iStyle} value={section.customData?.rows || 2}
              onChange={e => updateSectionCustomData(sectionId, { ...section.customData, rows: parseInt(e.target.value) || 2 })} />
          </div>
        </div>
      );
      case "data_chart": return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={lStyle}>Chart Type</label>
            <select style={iStyle} value={section.customData?.chartType || "bar"}
              onChange={e => updateSectionCustomData(sectionId, { ...section.customData, chartType: e.target.value })}>
              <option value="bar">Bar</option><option value="line">Line</option>
              <option value="pie">Pie</option><option value="area">Area</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={lStyle}>Data Source</label>
            <select style={iStyle} value={section.customData?.dataSource || "sales"}
              onChange={e => updateSectionCustomData(sectionId, { ...section.customData, dataSource: e.target.value })}>
              <option value="sales">Sales</option><option value="products">Products</option>
              <option value="suppliers">Suppliers</option><option value="rfqs">RFQs</option>
            </select>
          </div>
        </div>
      );
      case "custom_content": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <BilingualTextInput label="Content" value={section.customData?.content || { ar: "", en: "" }}
            onChange={val => updateSectionCustomData(sectionId, { ...section.customData, content: val })} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={lStyle}>Background Color</label>
            <input type="color" style={{ ...iStyle, height: 36, padding: "4px 6px" }}
              value={section.customData?.backgroundColor || "#ffffff"}
              onChange={e => updateSectionCustomData(sectionId, { ...section.customData, backgroundColor: e.target.value })} />
          </div>
        </div>
      );
      case "slider": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SliderItemsEditor items={section.customData?.items || []}
            onChange={items => updateSectionCustomData(sectionId, { ...section.customData, items })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={lStyle}>Auto Play</label>
              <select style={iStyle} value={section.customData?.autoPlay ? "true" : "false"}
                onChange={e => updateSectionCustomData(sectionId, { ...section.customData, autoPlay: e.target.value === "true" })}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={lStyle}>Interval (ms)</label>
              <input type="number" min={1000} max={10000} step={500} style={iStyle}
                value={section.customData?.interval || 3000}
                onChange={e => updateSectionCustomData(sectionId, { ...section.customData, interval: parseInt(e.target.value) || 3000 })} />
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  // ── Save handlers ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const handleSaveSections = async () => {
    setSaving(true);
    const result = await saveMobileHomepageSections(sections);
    setSaving(false);
    if (result.success) { setSavedSections(JSON.parse(JSON.stringify(sections))); showToast(t("saved")); }
    else showToast(result.error || t("error"));
  };

  const handleSaveContent = async () => {
    setSaving(true);
    const result = await saveMobileHomepageContent(content);
    setSaving(false);
    if (result.success) { setSavedContent(JSON.parse(JSON.stringify(content))); showToast(t("saved")); }
    else showToast(result.error || t("error"));
  };

  const handleSave    = () => activeTab === "sections" ? handleSaveSections() : handleSaveContent();
  const handleDiscard = () => {
    if (activeTab === "sections") { setSections(JSON.parse(JSON.stringify(savedSections))); setSelected(new Set()); setExpandedId(null); }
    else setContent(JSON.parse(JSON.stringify(savedContent)));
  };

  // ── Content updaters ──────────────────────────────────────────────────────────
  const updateHero         = (u: Partial<HeroContent>)        => setContent(c => ({ ...c, hero: { ...c.hero, ...u } }));
  const updateHeroStats    = (u: Partial<HeroContent["stats"]>) => setContent(c => ({ ...c, hero: { ...c.hero, stats: { ...c.hero.stats, ...u } } }));
  const updateFlash        = (u: Partial<FlashDealsContent>)  => setContent(c => ({ ...c, flash_deals: { ...c.flash_deals, ...u } }));
  const updateMembership   = (u: Partial<MembershipContent>)  => setContent(c => ({ ...c, membership: { ...c.membership, ...u } }));
  const updateMembershipPerk = (i: number, u: Partial<{ value: string; label: BilingualText }>) => {
    const p = [...content.membership.perks]; p[i] = { ...p[i], ...u };
    setContent(c => ({ ...c, membership: { ...c.membership, perks: p } }));
  };
  const updatePromoCard = (i: number, u: Partial<PromoBannersContent["cards"][0]>) => {
    const cards = [...content.promo_banners.cards]; cards[i] = { ...cards[i], ...u };
    setContent(c => ({ ...c, promo_banners: { ...c.promo_banners, cards } }));
  };
  const updateRFQ = (u: Partial<RFQContent>) => setContent(c => ({ ...c, rfq: { ...c.rfq, ...u } }));

  // ── Shared style helpers ──────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 1px 2px rgba(16,24,40,0.05)" };
  const fStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
  const btnIcon = (danger?: boolean): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: "#fff",
    color: danger ? C.danger : C.textMuted, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
  });

  const TABS = [
    { id: "sections" as const, label: t("tabSections") },
    { id: "hero"     as const, label: t("tabHero") },
    { id: "flash"    as const, label: t("tabFlash") },
    { id: "membership" as const, label: t("tabMembership") },
    { id: "promo"    as const, label: t("tabPromo") },
    { id: "rfq"      as const, label: t("tabRFQ") },
  ];

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", fontSize: 14, color: C.text }}>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: "none",
              color: activeTab === tab.id ? C.primary : C.textMuted,
              borderBottom: activeTab === tab.id ? `2px solid ${C.primary}` : "2px solid transparent", marginBottom: -1 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECTIONS TAB ── */}
      {activeTab === "sections" && (
        <div style={card}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", gap: 7, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px" }}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={C.textMuted} strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder={t("searchSections")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ border: "none", background: "none", outline: "none", fontSize: 13, flex: 1, color: C.text }} />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {([ ["all", t("filterAll"), sections.length], ["visible", t("filterVisible"), visibleCount], ["hidden", t("filterHidden"), hiddenCount] ] as const).map(([key, label, cnt]) => (
                <button key={key} onClick={() => setStatusFilter(key as "all" | "visible" | "hidden")}
                  style={{ border: `1px solid ${statusFilter === key ? C.text : C.border}`, background: statusFilter === key ? C.text : "#fff",
                    color: statusFilter === key ? "#fff" : C.textMuted, fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 20, cursor: "pointer" }}>
                  {label} <span style={{ opacity: 0.65 }}>{cnt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: C.primarySoft, borderBottom: `1px solid ${C.primaryBorder}`, fontSize: 12.5, color: "#3730A3", fontWeight: 600 }}>
              <span>{selected.size} {t("selectedCount")}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => bulkSetVisible(true)}  style={{ border: `1px solid ${C.primaryBorder}`, background: "#fff", color: C.primary, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6, cursor: "pointer" }}>{t("bulkEnable")}</button>
              <button onClick={() => bulkSetVisible(false)} style={{ border: `1px solid ${C.primaryBorder}`, background: "#fff", color: C.primary, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 6, cursor: "pointer" }}>{t("bulkDisable")}</button>
              <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: "#3730A3", textDecoration: "underline", cursor: "pointer", fontWeight: 600 }}>{t("bulkClear")}</button>
            </div>
          )}

          {/* Section rows */}
          <div style={{ padding: 8 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "30px 10px", textAlign: "center", color: C.textFaint }}>{t("noResults")}</div>
            )}
            {filtered.map(section => {
              const realIdx  = sections.findIndex(x => x.id === section.id);
              const isCore   = CORE_IDS.has(section.id);
              const isCfg    = CONFIGURABLE_TYPES.has(section.type);
              const isExpand = expandedId === section.id;
              const iconPath = SECTION_ICONS[section.type] ?? SECTION_ICONS.listing_category;

              return (
                <div key={section.id} data-sid={section.id} draggable
                  onDragStart={() => onDragStart(section.id)} onDragOver={onDragOver} onDrop={() => onDrop(section.id)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 10px", borderRadius: 10,
                    border: `1px solid ${C.border}`, marginBottom: 3, background: "#fff", opacity: section.enabled ? 1 : 0.6 }}>
                  <span style={{ cursor: "grab", paddingTop: 4, flexShrink: 0 }}><IconDrag /></span>
                  <input type="checkbox" style={{ marginTop: 5, flexShrink: 0, width: 15, height: 15, accentColor: C.primary, cursor: "pointer" }}
                    checked={selected.has(section.id)} onChange={() => toggleSelect(section.id)} />
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: C.bg, color: C.textMuted, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    {realIdx + 1}
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{section.title.en}</span>
                      <span style={{ color: C.textMuted, fontSize: 12.5 }}>/ {section.title.ar}</span>
                      {isCore && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1.5px 6px", borderRadius: 5, background: C.warningSoft, color: C.warning }}>Core</span>}
                      {isCfg  && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1.5px 6px", borderRadius: 5, background: "#EEF4FF", color: "#1849A9" }}>Configurable</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 2 }}>
                      {section.enabled ? t("visibleOnHomepage") : t("hiddenFromUsers")}
                    </div>
                    {isExpand && isCfg && (
                      <div style={{ marginTop: 10, padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9 }}>
                        {renderSectionEditor(section.id)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {isCfg && (
                      <button title="Configure" onClick={() => setExpandedId(expandedId === section.id ? null : section.id)} style={btnIcon()}>
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                    <button title="Duplicate" onClick={() => duplicateSection(section.id)} style={btnIcon()}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button title="Move up" disabled={realIdx === 0} onClick={() => moveSection(realIdx, "up")}
                      style={{ ...btnIcon(), opacity: realIdx === 0 ? 0.35 : 1, cursor: realIdx === 0 ? "not-allowed" : "pointer" }}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button title="Move down" disabled={realIdx === sections.length - 1} onClick={() => moveSection(realIdx, "down")}
                      style={{ ...btnIcon(), opacity: realIdx === sections.length - 1 ? 0.35 : 1, cursor: realIdx === sections.length - 1 ? "not-allowed" : "pointer" }}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    <button title={isCore ? "Core section" : "Remove"} disabled={isCore} onClick={() => removeSection(section.id)}
                      style={{ ...btnIcon(true), opacity: isCore ? 0.35 : 1, cursor: isCore ? "not-allowed" : "pointer" }}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                    <button disabled={isCore} onClick={() => toggleSection(section.id)}
                      style={{ width: 36, height: 21, borderRadius: 12, background: section.enabled ? C.success : C.borderStrong,
                        position: "relative", cursor: isCore ? "not-allowed" : "pointer", border: "none", padding: 0, flexShrink: 0, marginTop: 1, opacity: isCore ? 0.5 : 1 }}>
                      <span style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 2,
                        left: section.enabled ? 17 : 2, transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,.25)" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add section grid */}
          <div style={{ padding: "14px 16px 18px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 10 }}>{t("addNewSection")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {ADD_OPTIONS.map(opt => (
                <button key={opt.type} onClick={() => addSection(opt.type)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px",
                    border: `1.5px dashed ${C.borderStrong}`, borderRadius: 10, background: "#fff", cursor: "pointer", color: C.textMuted, fontSize: 11.5, fontWeight: 600 }}>
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={opt.iconPath}/></svg>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO TAB ── */}
      {activeTab === "hero" && (
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{t("heroTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BilingualTextInput label={t("heroKicker")} value={content.hero.kicker} onChange={v => updateHero({ kicker: v })} placeholder={{ ar: "ابنِ بثقة", en: "BUILD WITH CONFIDENCE" }} />
            <BilingualTextInput label={t("heroTitleLabel")} value={content.hero.title} onChange={v => updateHero({ title: v })} placeholder={{ ar: "سوق البناء رقم #1 في مصر", en: "Egypt's #1 Construction Marketplace" }} />
            <BilingualTextInput label={t("heroSubtitle")} value={content.hero.subtitle} onChange={v => updateHero({ subtitle: v })} placeholder={{ ar: "مواد بناء عالية الجودة", en: "High-quality construction materials" }} />
            <BilingualTextInput label={t("browseDealsText")} value={content.hero.browseDealsText} onChange={v => updateHero({ browseDealsText: v })} placeholder={{ ar: "تصفح الصفقات", en: "Browse Deals" }} />
            <BilingualTextInput label={t("postRfqText")} value={content.hero.postRfqText} onChange={v => updateHero({ postRfqText: v })} placeholder={{ ar: "نشر طلب عرض", en: "Post RFQ" }} />
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>{t("heroStats")}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {([["statProducts","products",content.hero.stats.products],["statSuppliers","suppliers",content.hero.stats.suppliers],["statOnTime","onTime",content.hero.stats.onTime]] as const).map(([lk,key,val]) => (
                  <div key={key} style={fStyle}>
                    <label style={lStyle}>{t(lk)}</label>
                    <input style={iStyle} value={val} onChange={e => updateHeroStats({ [key]: e.target.value } as any)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FLASH TAB ── */}
      {activeTab === "flash" && (
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{t("flashDealsTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BilingualTextInput label={t("flashTitle")} value={content.flash_deals.title} onChange={v => updateFlash({ title: v })} placeholder={{ ar: "الصفقات السريعة", en: "Flash Deals" }} />
            <BilingualTextInput label={t("flashSubtitle")} value={content.flash_deals.subtitle} onChange={v => updateFlash({ subtitle: v })} placeholder={{ ar: "عروض محدودة الوقت", en: "Limited time offers" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {([["timerHours","timerHours",content.flash_deals.timerHours],["timerMinutes","timerMinutes",content.flash_deals.timerMinutes],["timerSeconds","timerSeconds",content.flash_deals.timerSeconds]] as const).map(([lk,key,val]) => (
                <div key={key} style={fStyle}>
                  <label style={lStyle}>{t(lk)}</label>
                  <input type="number" style={iStyle} value={val} onChange={e => updateFlash({ [key]: parseInt(e.target.value) || 0 } as any)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBERSHIP TAB ── */}
      {activeTab === "membership" && (
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{t("membershipTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BilingualTextInput label={t("memberKicker")} value={content.membership.kicker} onChange={v => updateMembership({ kicker: v })} placeholder={{ ar: "عضوية مميزة", en: "PREMIUM MEMBERSHIP" }} />
            <BilingualTextInput label={t("welcomeText")} value={content.membership.welcomeText} onChange={v => updateMembership({ welcomeText: v })} placeholder={{ ar: "مرحباً بعودتك", en: "Welcome Back" }} />
            <BilingualTextInput label={t("memberSubtitle")} value={content.membership.subtitle} onChange={v => updateMembership({ subtitle: v })} placeholder={{ ar: "استمتع بامتيازات حصرية", en: "Enjoy exclusive benefits" }} />
            <BilingualTextInput label={t("redeemButton")} value={content.membership.redeemButton} onChange={v => updateMembership({ redeemButton: v })} placeholder={{ ar: "استرداد", en: "Redeem" }} />
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>{t("membershipPerks")}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {content.membership.perks.map((perk, i) => (
                  <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                    <label style={{ ...lStyle, display: "block", marginBottom: 6 }}>{t("perkValue")} {i + 1}</label>
                    <input style={{ ...iStyle, marginBottom: 8 }} value={perk.value} onChange={e => updateMembershipPerk(i, { value: e.target.value })} />
                    <BilingualTextInput label={`${t("perkLabel")} ${i + 1}`} value={perk.label} onChange={v => updateMembershipPerk(i, { label: v })} placeholder={{ ar: "خصم خاص", en: "Special Discount" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMO TAB ── */}
      {activeTab === "promo" && (
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{t("promoTitle")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {content.promo_banners.cards.map((card2, i) => (
              <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>{t("promoCard")} {i + 1}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <BilingualTextInput label={t("promoKicker")} value={card2.kicker} onChange={v => updatePromoCard(i, { kicker: v })} placeholder={{ ar: "شحن مجاني", en: "FREE SHIPPING" }} />
                  <BilingualTextInput label={t("promoCardTitle")} value={card2.title} onChange={v => updatePromoCard(i, { title: v })} placeholder={{ ar: "على جميع الطلبات", en: "On All Orders" }} />
                  <BilingualTextInput label={t("promoCta")} value={card2.cta} onChange={v => updatePromoCard(i, { cta: v })} placeholder={{ ar: "اطلب الآن", en: "Claim Now" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={fStyle}><label style={lStyle}>{t("promoLink")}</label><input style={iStyle} value={card2.link} onChange={e => updatePromoCard(i, { link: e.target.value })} /></div>
                    <div style={fStyle}>
                      <label style={lStyle}>{t("promoColor")}</label>
                      <select style={iStyle} value={card2.color} onChange={e => updatePromoCard(i, { color: e.target.value as typeof card2.color })}>
                        <option value="primary">{t("colorPrimary")}</option><option value="dark">{t("colorDark")}</option>
                        <option value="orange">{t("colorOrange")}</option><option value="green">{t("colorGreen")}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RFQ TAB ── */}
      {activeTab === "rfq" && (
        <div style={{ ...card, padding: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{t("rfqTitleLabel")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BilingualTextInput label={t("rfqTitle")} value={content.rfq.title} onChange={v => updateRFQ({ title: v })} placeholder={{ ar: "تحتاج مواد بناء؟", en: "Need Construction Materials?" }} />
            <BilingualTextInput label={t("rfqSubtitle")} value={content.rfq.subtitle} onChange={v => updateRFQ({ subtitle: v })} placeholder={{ ar: "احصل على عروض من موردين موثوقين", en: "Get quotes from trusted suppliers" }} />
            <BilingualTextInput label={t("rfqCta")} value={content.rfq.cta} onChange={v => updateRFQ({ cta: v })} placeholder={{ ar: "نشر طلب عرض", en: "Post RFQ" }} />
          </div>
        </div>
      )}

      {/* ── FLOATING SAVE BAR ── */}
      <div style={{
        position: "fixed", bottom: 18, left: "50%",
        transform: isDirty ? "translate(-50%,0)" : "translate(-50%,80px)",
        opacity: isDirty ? 1 : 0, pointerEvents: isDirty ? "auto" : "none",
        background: "#101828", color: "#fff", padding: "12px 14px 12px 18px", borderRadius: 12,
        boxShadow: "0 12px 28px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 14,
        fontSize: 13, fontWeight: 600, transition: "all 0.25s ease", zIndex: 200, whiteSpace: "nowrap",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.warning, display: "inline-block" }} />
          {t("unsavedChanges")}
        </span>
        <button onClick={handleDiscard} disabled={saving}
          style={{ border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: "#1D2433", color: "#CBD2DC" }}>
          {t("discard")}
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", background: C.primary, color: "#fff" }}>
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 18, left: "50%", transform: "translate(-50%,0)",
          background: C.success, color: "#fff", padding: "10px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 700, zIndex: 201, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,.15)",
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
