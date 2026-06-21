"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

// ─── Types ──────────────────────────────────────────────────────────────────
export type DashCategory = { ar: string; en: string; count: number };
export type DashStatus = { status: string; count: number };
export type DashMonth = { month: string; listings: number; users: number };
export type DashListing = {
  id: string;
  title: string;
  category: string;
  status: string;
  price: number;
  views: number;
  created: string;
};
export type DashUser = { id: string; name: string; type: string; created: string };

export type DashboardData = {
  pending: number;
  totalListings: number;
  totalUsers: number;
  totalValue: number;
  byCategory: DashCategory[];
  byStatus: DashStatus[];
  byMonth: DashMonth[];
  recentListings: DashListing[];
  recentUsers: DashUser[];
};

// ─── Palette (matches the BusinessObjects-style design) ───────────────────────
const C = {
  ribbon1: "#EAF2FB",
  ribbon2: "#D7E7F8",
  ribbonBorder: "#B7CFE8",
  accent: "#1F6FCB",
  accentDark: "#15518F",
  ink: "#1B3A5C",
  inkDim: "#5A7593",
  panelBorder: "#C6D6E6",
  canvas: "#EEF3F8",
  gridHead: "#E3EDF7",
  green: "#3B9B3B",
  red: "#C0392B",
  gold: "#D9A441",
  blue: "#2D6FB8",
  teal: "#2E9E8F",
};

const STATUS_COLORS: Record<string, string> = {
  active: C.green,
  pending: C.gold,
  sold: C.blue,
  rented: C.teal,
  paused: C.red,
};

// ─── Inline icons ─────────────────────────────────────────────────────────────
function Icon({ d, stroke = C.inkDim }: { d: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICON = {
  refresh: "M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4.5v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 19.5v-4h4",
  export: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  verify: "M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  expert: "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z",
  chat: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z",
  card: "M3 7h18v12H3zM3 11h18",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  star: "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z",
  image: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
  plus: "M12 5v14M5 12h14",
};

// ─── Charts (dependency-free SVG) ─────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 520;
  const H = 230;
  const padL = 30;
  const padB = 64;
  const padT = 10;
  const padR = 8;
  const max = Math.max(1, ...data.map((d) => d.count));
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = Math.max(1, data.length);
  const slot = plotW / n;
  const barW = Math.min(34, slot * 0.6);
  const ticks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (plotH * i) / ticks;
        const val = Math.round((max * (ticks - i)) / ticks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EAF0F7" strokeWidth={1} />
            <text x={padL - 4} y={y + 3} fontSize={9} fill={C.inkDim} textAnchor="end">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.count / max) * plotH;
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + plotH - h;
        const short = d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label;
        const cx = padL + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={C.green} rx={1} />
            <text x={cx} y={H - padB + 12} fontSize={9} fill={C.inkDim} textAnchor="end" transform={`rotate(-55 ${cx} ${H - padB + 12})`}>{short}</text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke={C.panelBorder} strokeWidth={1} />
    </svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const size = 150;
  const r = 56;
  const cx = size / 2;
  const cy = size / 2;
  const slices = data.filter((d) => d.value > 0);
  const total = Math.max(1, slices.reduce((s, d) => s + d.value, 0));
  const start = -Math.PI / 2;
  const arcs = slices.map((d, i) => {
    const before = slices.slice(0, i).reduce((s, x) => s + x.value, 0);
    const a0 = start + (before / total) * Math.PI * 2;
    const a1 = start + ((before + d.value) / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return { d: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, color: d.color };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.42} fill="#fff" />
    </svg>
  );
}

function LineChart({ data, aColor, bColor }: { data: { label: string; a: number; b: number }[]; aColor: string; bColor: string }) {
  const W = 520;
  const H = 250;
  const padL = 30;
  const padR = 30;
  const padT = 12;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = Math.max(1, data.length);
  const maxA = Math.max(1, ...data.map((d) => d.a));
  const maxB = Math.max(1, ...data.map((d) => d.b));
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const px = (i: number) => padL + step * i;
  const pyA = (v: number) => padT + plotH - (v / maxA) * plotH;
  const pyB = (v: number) => padT + plotH - (v / maxB) * plotH;
  const lineA = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${pyA(d.a)}`).join(" ");
  const lineB = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${pyB(d.b)}`).join(" ");
  const ticks = 4;
  const labelEvery = Math.ceil(n / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = padT + (plotH * i) / ticks;
        return <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#EAF0F7" strokeWidth={1} />;
      })}
      <path d={lineA} fill="none" stroke={aColor} strokeWidth={2} />
      <path d={lineB} fill="none" stroke={bColor} strokeWidth={2} />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={pyA(d.a)} r={2.6} fill={aColor} />
          <circle cx={px(i)} cy={pyB(d.b)} r={2.6} fill={bColor} />
          {i % labelEvery === 0 && (
            <text x={px(i)} y={H - padB + 14} fontSize={9} fill={C.inkDim} textAnchor="middle">{d.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Chrome sub-components ────────────────────────────────────────────────────
function PanelHeadIcons() {
  return (
    <div style={{ display: "flex", gap: 5, flex: "none" }}>
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={C.inkDim} strokeWidth={1.6}>
        <rect x={4} y={4} width={16} height={16} rx={1.5} />
        <path d="M8 13l3-3 2 2 3-4" />
      </svg>
      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke={C.inkDim} strokeWidth={1.6}>
        <path d="M4 5h16l-6 7v6l-4-2v-4z" />
      </svg>
    </div>
  );
}

function Panel({ title, children, bodyPad = true }: { title: string; children: React.ReactNode; bodyPad?: boolean }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.panelBorder}`, borderRadius: 3, boxShadow: "0 1px 2px rgba(20,40,70,.06)", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 10px", background: "linear-gradient(#F7FBFF,#EAF2FB)", borderBottom: `1px solid ${C.panelBorder}` }}>
        <h4 style={{ fontSize: 11.5, fontWeight: 700, color: C.accentDark, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h4>
        <PanelHeadIcons />
      </div>
      <div style={{ padding: bodyPad ? "8px 10px 10px" : 0, flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function RibbonButton({ href, label, iconPath, onClick }: { href?: string; label: string; iconPath: string; onClick?: () => void }) {
  const inner = (
    <>
      <Icon d={iconPath} stroke={C.accentDark} />
      <span style={{ marginTop: 3, lineHeight: 1.15 }}>{label}</span>
    </>
  );
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
    width: 60,
    padding: "4px 2px",
    border: "1px solid transparent",
    background: "transparent",
    borderRadius: 3,
    color: C.ink,
    fontSize: 9.5,
    textAlign: "center",
    cursor: "pointer",
  };
  if (href) {
    return (
      <Link href={href} style={style} className="ad-rbtn">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} style={style} className="ad-rbtn">
      {inner}
    </button>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 10px 4px", borderInlineEnd: `1px solid ${C.ribbonBorder}`, flex: "none" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 2, flex: 1 }}>{children}</div>
      <div style={{ fontSize: 10.5, color: C.inkDim, marginTop: 4, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminDashboard({ data }: { data: DashboardData }) {
  const t = useTranslations("adminDashboard");
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "data" | "design">("home");

  const fmtMonth = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  };
  const fmtNum = (n: number) => new Intl.NumberFormat(locale).format(n);
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(n);
  const catLabel = (c: DashCategory) => (locale === "ar" ? c.ar : c.en) || c.en || c.ar;
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: t("statusActive"),
      sold: t("statusSold"),
      rented: t("statusRented"),
      pending: t("statusPending"),
      paused: t("statusPaused"),
    };
    return map[s] ?? s;
  };
  const typeLabel = (ty: string) => (ty === "contractor" ? t("typeContractor") : ty === "supplier" ? t("typeSupplier") : ty);

  const tabs: { id: "home" | "data" | "design"; label: string }[] = [
    { id: "home", label: t("tabHome") },
    { id: "data", label: t("tabData") },
    { id: "design", label: t("tabDesign") },
  ];

  const usersLinks = [
    { href: "/admin/users", label: t("linkUsers"), icon: ICON.users },
    { href: "/admin/verifications", label: t("linkVerify"), icon: ICON.verify },
    { href: "/admin/expert-verifications", label: t("linkExpert"), icon: ICON.expert },
    { href: "/admin/messages", label: t("linkMessages"), icon: ICON.chat },
    { href: "/admin/subscriptions", label: t("linkSubs"), icon: ICON.card },
    { href: "/admin/subscription-services", label: t("linkSubServices"), icon: ICON.cog },
    { href: "/admin/rfq", label: t("linkRfq"), icon: ICON.doc },
    { href: "/admin/deletion-requests", label: t("linkDeletion"), icon: ICON.trash },
  ];
  const contentLinks = [
    { href: "/admin/listings", label: t("linkListings"), icon: ICON.grid },
    { href: "/admin/categories", label: t("linkCategories"), icon: ICON.tag },
    { href: "/admin/homepage", label: t("linkHomepage"), icon: ICON.home },
    { href: "/admin/homepage/mobile", label: t("linkMobileHome"), icon: ICON.phone },
    { href: "/admin/veterans-corner", label: t("linkVeterans"), icon: ICON.star },
    { href: "/admin/media", label: t("linkMedia"), icon: ICON.image },
    { href: "/listings/new", label: t("linkAddListing"), icon: ICON.plus },
  ];

  const kpis = [
    { label: t("kpiPending"), value: fmtNum(data.pending), href: "/admin/listings", accent: true },
    { label: t("kpiListings"), value: fmtNum(data.totalListings), href: "/admin/listings" },
    { label: t("kpiUsers"), value: fmtNum(data.totalUsers), href: "/admin/users" },
    { label: t("kpiValue"), value: fmtMoney(data.totalValue), href: "/admin/listings" },
  ];

  const statusData = data.byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({ label: statusLabel(s.status), value: s.count, color: STATUS_COLORS[s.status] ?? C.inkDim }));
  const lineData = data.byMonth.map((m) => ({ label: fmtMonth(m.month), a: m.listings, b: m.users }));

  return (
    <div className="ad-root" style={{ color: C.ink, fontSize: 13 }}>
      <style>{`
        .ad-rbtn:hover{ background:#fff; border-color:${C.ribbonBorder} !important; }
        .ad-window ::-webkit-scrollbar{ width:9px; height:9px; }
        .ad-window ::-webkit-scrollbar-track{ background:#EEF3F8; }
        .ad-window ::-webkit-scrollbar-thumb{ background:#C2D3E4; border-radius:5px; }
        .ad-objlink:hover{ background:#fff; border-color:${C.accent} !important; }
        .ad-trow:hover{ background:#F4F8FC; }
        @media (max-width:1180px){
          .ad-grid-r1{ grid-template-columns:1fr !important; }
          .ad-grid-r2{ grid-template-columns:1fr !important; }
        }
        @media (max-width:820px){
          .ad-sidebar{ display:none !important; }
        }
      `}</style>

      <div className="ad-window" style={{ background: "#fff", border: "1px solid #2F4A63", borderRadius: 4, boxShadow: "0 18px 50px -16px rgba(0,0,0,.45)", overflow: "hidden" }}>
        {/* title strip */}
        <div style={{ background: "linear-gradient(#1E5A9A,#15426F)", display: "flex", alignItems: "center", padding: "5px 8px", gap: 8, color: "#fff" }}>
          <div style={{ width: 24, height: 24, borderRadius: 4, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={15} height={15}>
              <rect x={2} y={2} width={9} height={9} fill={C.blue} />
              <rect x={13} y={2} width={9} height={9} fill={C.green} />
              <rect x={2} y={13} width={9} height={9} fill={C.gold} />
              <rect x={13} y={13} width={9} height={9} fill={C.red} />
            </svg>
          </div>
          <div style={{ background: "#D75BA8", color: "#fff", fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: "3px 3px 0 0", marginInlineStart: 14 }}>{t("contextTab")}</div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ background: "#fff", color: C.accentDark, fontWeight: 700, fontSize: 13, padding: "5px 16px", borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}>{t("centerTitle")}</div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <span style={{ width: 26, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>—</span>
            <span style={{ width: 26, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>▢</span>
          </div>
        </div>


        {/* ribbon */}
        <div style={{ background: `linear-gradient(${C.ribbon1},${C.ribbon2})`, display: "flex", alignItems: "stretch", padding: "6px 10px 4px", overflowX: "auto" }}>
          <RibbonGroup label={t("groupRefresh")}>
            <RibbonButton label={t("refresh")} iconPath={ICON.refresh} onClick={() => router.refresh()} />
            <RibbonButton label={t("export")} iconPath={ICON.export} onClick={() => window.print()} />
          </RibbonGroup>
          <RibbonGroup label={t("groupUsers")}>
            {usersLinks.map((l) => (
              <RibbonButton key={l.href} href={l.href} label={l.label} iconPath={l.icon} />
            ))}
          </RibbonGroup>
          <RibbonGroup label={t("groupContent")}>
            {contentLinks.map((l) => (
              <RibbonButton key={l.href} href={l.href} label={l.label} iconPath={l.icon} />
            ))}
          </RibbonGroup>
        </div>

        {/* body */}
        <div style={{ display: "flex", background: C.canvas }}>
          {/* sidebar */}
          <aside className="ad-sidebar" style={{ width: 248, flex: "none", background: "#fff", borderInlineEnd: `1px solid ${C.panelBorder}`, display: "flex", flexDirection: "column", maxHeight: 820 }}>
            <div style={{ padding: "10px 12px 6px" }}>
              <div style={{ fontSize: 11, color: C.inkDim, fontWeight: 600, marginBottom: 3 }}>{t("dataSource")}</div>
              <div style={{ width: "100%", border: `1px solid ${C.panelBorder}`, borderRadius: 3, padding: "5px 7px", fontSize: 12, background: "#fff" }}>{t("dataSourceValue")}</div>
            </div>
            <div style={{ padding: "4px 12px 6px" }}>
              <div style={{ fontSize: 11, color: C.inkDim, fontWeight: 600, marginBottom: 3 }}>{t("query")}</div>
              <div style={{ width: "100%", border: `1px solid ${C.panelBorder}`, borderRadius: 3, padding: "5px 7px", fontSize: 12, background: "#fff" }}>{t("queryValue")}</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, paddingBottom: 14 }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: ".02em" }}>{t("dataItems")}</div>
              <div style={{ fontSize: 10.5, color: C.inkDim, padding: "2px 12px 5px", fontWeight: 600 }}>{t("metrics")}</div>
              {kpis.map((k) => (
                <Link
                  key={k.label}
                  href={k.href}
                  className="ad-objlink"
                  style={{ display: "flex", alignItems: "center", gap: 7, margin: "0 10px 6px", padding: "6px 8px", background: "#EAF2FB", border: `1px solid #BFD7F0`, borderRadius: 4, fontSize: 11.5, color: C.ink, textDecoration: "none" }}
                >
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.label}</span>
                  <span style={{ flex: "none", color: C.accentDark, fontWeight: 700 }}>{k.value}</span>
                </Link>
              ))}
              <div style={{ fontSize: 10.5, color: C.inkDim, padding: "2px 12px 5px", fontWeight: 600 }}>{t("quickLinks")}</div>
              {[...usersLinks, ...contentLinks].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="ad-objlink"
                  style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 10px 4px", padding: "5px 8px", background: "#fff", border: `1px solid #E1EAF4`, borderRadius: 4, fontSize: 11.5, color: C.ink, textDecoration: "none" }}
                >
                  <Icon d={l.icon} stroke={C.accent} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</span>
                </Link>
              ))}
            </div>
          </aside>

          {/* canvas */}
          <main style={{ flex: 1, minWidth: 0, padding: "14px 16px 24px" }}>
            <div style={{ textAlign: "center", fontSize: 21, fontWeight: 700, color: C.accentDark, marginBottom: 12 }}>{t("title")}</div>

            <div className="ad-grid-r1" style={{ display: "grid", gap: 10, marginBottom: 10, gridTemplateColumns: "1.5fr 1fr 1.4fr" }}>
              <Panel title={t("panelByCategory")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 11, marginBottom: 4 }}>
                  <span><span style={{ width: 10, height: 10, display: "inline-block", marginInlineEnd: 4, borderRadius: 1, background: C.green, verticalAlign: -1 }} />{t("legendListings")}</span>
                </div>
                <div style={{ height: 230 }}>
                  {data.byCategory.length ? <BarChart data={data.byCategory.map((c) => ({ label: catLabel(c), count: c.count }))} /> : <Empty t={t} />}
                </div>
              </Panel>

              <Panel title={t("kpiValue")}>
                <div style={{ fontSize: 11, color: C.inkDim, marginBottom: 6 }}>{t("kpiValue")}</div>
                <div style={{ border: `1px solid ${C.panelBorder}`, borderRadius: 3, padding: "14px 10px 8px", background: "#FAFCFE", overflowX: "auto" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.accentDark, fontFamily: "Consolas,Segoe UI,monospace", whiteSpace: "nowrap" }}>{fmtMoney(data.totalValue)}</div>
                </div>
                <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 700, color: C.ink, marginBottom: 2, textAlign: "center" }}>{t("panelByStatus")}</div>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 150 }}>
                  {statusData.length ? <DonutChart data={statusData} /> : <Empty t={t} />}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", justifyContent: "center", fontSize: 10.5, marginTop: 4 }}>
                  {statusData.map((s) => (
                    <span key={s.label}><span style={{ width: 9, height: 9, display: "inline-block", marginInlineEnd: 4, borderRadius: 1, background: s.color, verticalAlign: -1 }} />{s.label} ({s.value})</span>
                  ))}
                </div>
              </Panel>

              <Panel title={t("panelGrowth")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 11, marginBottom: 4 }}>
                  <span><span style={{ width: 10, height: 10, display: "inline-block", marginInlineEnd: 4, borderRadius: 1, background: C.red, verticalAlign: -1 }} />{t("legendListings")}</span>
                  <span><span style={{ width: 10, height: 10, display: "inline-block", marginInlineEnd: 4, borderRadius: 1, background: C.blue, verticalAlign: -1 }} />{t("legendUsers")}</span>
                </div>
                <div style={{ height: 250 }}>
                  {lineData.length ? <LineChart data={lineData} aColor={C.red} bColor={C.blue} /> : <Empty t={t} />}
                </div>
              </Panel>
            </div>

            <div className="ad-grid-r2" style={{ display: "grid", gap: 10, gridTemplateColumns: "1.6fr 1fr" }}>
              <Panel title={t("panelRecentListings")} bodyPad={false}>
                <div style={{ maxHeight: 260, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr>
                        {[t("colTitle"), t("colCategory"), t("colStatus"), t("colPrice"), t("colViews"), t("colDate")].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentListings.map((r) => (
                        <tr key={r.id} className="ad-trow">
                          <td style={tdStyle}>{r.title}</td>
                          <td style={tdStyle}>{r.category}</td>
                          <td style={tdStyle}>{statusLabel(r.status)}</td>
                          <td style={tdNum}>{fmtMoney(r.price)}</td>
                          <td style={tdNum}>{fmtNum(r.views)}</td>
                          <td style={tdStyle}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(r.created))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title={t("panelRecentUsers")} bodyPad={false}>
                <div style={{ maxHeight: 260, overflow: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr>
                        {[t("colName"), t("colType"), t("colJoined")].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentUsers.map((u) => (
                        <tr key={u.id} className="ad-trow">
                          <td style={tdStyle}>{u.name}</td>
                          <td style={tdStyle}>{typeLabel(u.type)}</td>
                          <td style={tdStyle}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(u.created))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Empty({ t }: { t: ReturnType<typeof useTranslations> }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: C.inkDim }}>{t("empty")}</div>;
}

const thStyle: React.CSSProperties = {
  background: C.gridHead,
  color: C.accentDark,
  fontWeight: 700,
  textAlign: "start",
  padding: "6px 8px",
  borderBottom: `1px solid ${C.panelBorder}`,
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
};
const tdStyle: React.CSSProperties = { padding: "5px 8px", borderBottom: "1px solid #EEF2F7", whiteSpace: "nowrap" };
const tdNum: React.CSSProperties = { ...tdStyle, textAlign: "end", fontFamily: "Consolas,Segoe UI,monospace" };
