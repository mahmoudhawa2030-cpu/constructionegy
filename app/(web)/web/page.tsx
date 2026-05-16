"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

// Icons as SVG components
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[13px] h-[13px]" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const FireIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  machinery: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-4 0v2" />
    </svg>
  ),
  electronics: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  safety: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  materials: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  logistics: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  chemicals: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  healthcare: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  packaging: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  featured: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  all: (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

const categories = [
  { key: "machinery", color: "#E65100", bg: "#FFF3E0" },
  { key: "electronics", color: "#2E7D32", bg: "#E8F5E9" },
  { key: "safety", color: "#1565C0", bg: "#E3F2FD" },
  { key: "materials", color: "#6A1B9A", bg: "#F3E5F5" },
  { key: "logistics", color: "#00695C", bg: "#E0F7FA" },
  { key: "chemicals", color: "#F57F17", bg: "#FFF8E1" },
  { key: "healthcare", color: "#880E4F", bg: "#FCE4EC" },
  { key: "packaging", color: "#283593", bg: "#E8EAF6" },
  { key: "featured", color: "#00695C", bg: "#E0F2F1" },
  { key: "all", color: "#555", bg: "#F5F5F5" },
];

const flashDeals = [
  { name: "Hydraulic pump 3-stage", price: "$44", orig: "$71", discount: "-38%", claimed: 81, bg: "#FFF3E0" },
  { name: "HEPA H13 filter unit", price: "$6.20", orig: "$10.50", discount: "-41%", claimed: 92, bg: "#E8F5E9" },
  { name: "Servo motor 400W AC", price: "$56", orig: "$79", discount: "-29%", claimed: 55, bg: "#E3F2FD" },
  { name: "Pressure sensor 4–20mA", price: "$8.90", orig: "$13.30", discount: "-33%", claimed: 67, bg: "#F3E5F5" },
];

const products = [
  { name: "Conveyor belt heavy-duty 6m industrial", price: "$220", range: "$310", moq: "2 units", rating: "★★★★★", reviews: "1.2k", supplier: "MetaTech Corp", badge: "Hot", badgeBg: "#FFEBEE", badgeColor: "#B71C1C", bg: "#FFF3E0" },
  { name: "Safety goggle EN 166 certified bulk pack", price: "$3.20", range: "$5.50", moq: "100 units", rating: "★★★★★", reviews: "3.4k", supplier: "Acme Industrial", badge: "New", badgeBg: "#E8F5E9", badgeColor: "#1B5E20", bg: "#E8F5E9" },
  { name: "Biodegradable safety gloves nitrile 200pk", price: "$14.50", range: "$22", moq: "50 units", rating: "★★★★☆", reviews: "874", supplier: "GreenRoute Ltd", badge: "-18%", badgeBg: "#FFF8E1", badgeColor: "#E65100", bg: "#E0F7FA" },
  { name: "Pneumatic valve kit 12pc stainless", price: "$18.90", range: "$27", moq: "10 units", rating: "★★★★★", reviews: "2.1k", supplier: "Prexon Systems", badge: "-25%", badgeBg: "#FFF8E1", badgeColor: "#E65100", bg: "#E3F2FD" },
  { name: "Digital pressure sensor 4–20mA output", price: "$9.20", range: "$15", moq: "25 units", rating: "★★★★★", reviews: "650", supplier: "ZenKit Machinery", badge: "Bulk", badgeBg: "#EDE7F6", badgeColor: "#4527A0", bg: "#F3E5F5" },
  { name: "Hard hat ANSI Z89.1 bulk industrial pack", price: "$7.80", range: "$12", moq: "20 units", rating: "★★★★★", reviews: "1.8k", supplier: "Acme Industrial", badge: "Hot", badgeBg: "#FFEBEE", badgeColor: "#B71C1C", bg: "#FFF8E1" },
  { name: "Bearing unit SKF-style 6205 deep groove", price: "$2.40", range: "$4.10", moq: "50 units", rating: "★★★★★", reviews: "990", supplier: "Prexon Systems", badge: "New", badgeBg: "#E8F5E9", badgeColor: "#1B5E20", bg: "#E8F5E9" },
  { name: "First-aid kit industrial grade 50-person", price: "$34.00", range: "$48", moq: "5 units", rating: "★★★★☆", reviews: "440", supplier: "MedSupply Co", badge: "-15%", badgeBg: "#FFF8E1", badgeColor: "#E65100", bg: "#FCE4EC" },
];

const suppliers = [
  { initials: "AC", name: "Acme Industrial", years: "12", products: "2,400", rating: "4.9", reviews: "1.2k", tags: ["ISO 9001", "OEM"], bg: "#FFF3E0", color: "#E65100", following: false },
  { initials: "PX", name: "Prexon Systems", years: "8", products: "1,800", rating: "4.7", reviews: "940", tags: ["CE", "RoHS"], bg: "#E8F5E9", color: "#2E7D32", following: false },
  { initials: "ZK", name: "ZenKit Machinery", years: "5", products: "900", rating: "4.8", reviews: "610", tags: ["ISO 14001"], bg: "#E3F2FD", color: "#1565C0", following: true },
  { initials: "MT", name: "MetaTech Corp", years: "15", products: "3,100", rating: "4.6", reviews: "2.1k", tags: ["OEM", "ODM"], bg: "#F3E5F5", color: "#6A1B9A", following: false },
];

const trending = [
  { label: "HEPA filters", fire: true },
  { label: "Servo motors", fire: false },
  { label: "Safety gloves", fire: false },
  { label: "Pneumatic valves", fire: false },
  { label: "CNC parts", fire: false },
  { label: "Bulk packaging", fire: false },
  { label: "Safety harnesses", fire: false },
  { label: "Bearings", fire: false },
  { label: "Hydraulic pumps", fire: false },
  { label: "Pressure sensors", fire: false },
];

// Countdown timer component
function CountdownTimer() {
  const [time, setTime] = useState({ h: "05", m: "28", s: "44" });
  
  useEffect(() => {
    let totalSeconds = 5 * 3600 + 28 * 60 + 44;
    const interval = setInterval(() => {
      if (totalSeconds <= 0) {
        clearInterval(interval);
        return;
      }
      totalSeconds--;
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(totalSeconds % 60).padStart(2, "0");
      setTime({ h, m, s });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const TimeDigit = ({ value }: { value: string }) => (
    <div className="bg-[#1a1a1a] text-white text-sm font-bold py-1.5 px-2.5 rounded-lg min-w-[32px] text-center font-mono">
      {value}
    </div>
  );

  return (
    <div className="flex gap-1 items-center">
      <TimeDigit value={time.h} />
      <span className="text-[#888] text-sm font-bold">:</span>
      <TimeDigit value={time.m} />
      <span className="text-[#888] text-sm font-bold">:</span>
      <TimeDigit value={time.s} />
    </div>
  );
}

export default function WebHomePage() {
  const t = useTranslations("storefront");
  const [activeTab, setActiveTab] = useState("All");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [followedSuppliers, setFollowedSuppliers] = useState<Set<string>>(new Set(["ZK"]));

  const toggleFavorite = (index: number) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(index)) newFavs.delete(index);
    else newFavs.add(index);
    setFavorites(newFavs);
  };

  const toggleFollow = (initials: string) => {
    const newFollowed = new Set(followedSuppliers);
    if (newFollowed.has(initials)) newFollowed.delete(initials);
    else newFollowed.add(initials);
    setFollowedSuppliers(newFollowed);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      {/* Sub Navigation */}
      <div className="bg-[#A01818] border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center overflow-x-auto scrollbar-hide">
          <button className="flex items-center gap-1 px-4 py-2.5 text-xs font-medium text-white border-b-2 border-[#FFCA28] whitespace-nowrap">
            <FireIcon className="w-3 h-3 text-[#FFCA28]" />
            Flash Deals
          </button>
          <div className="w-px h-4 bg-white/15 mx-1" />
          {["Machinery", "Electronics", "Safety", "Raw Materials", "Logistics", "Chemicals", "Healthcare", "Packaging", "Suppliers", "Post RFQ"].map((item) => (
            <button key={item} className="px-4 py-2.5 text-xs font-medium text-white/70 hover:text-white border-b-2 border-transparent whitespace-nowrap transition-colors">
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Hero Banner */}
            <div className="rounded-2xl overflow-hidden bg-[#C62828]">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px]">
                <div className="p-8 md:p-10">
                  <div className="text-[11px] text-[#FFCA28] font-bold tracking-wider uppercase mb-2">
                    {t("heroKicker")}
                  </div>
                  <h1 className="text-3xl md:text-[32px] font-bold text-white leading-tight tracking-tight mb-3">
                    {t("heroTitle")}
                  </h1>
                  <p className="text-sm text-white/75 mb-6 max-w-md">
                    {t("heroSubtitle")}
                  </p>
                  <div className="flex gap-2.5">
                    <button className="bg-[#FFCA28] text-[#7B1A1A] px-6 py-2.5 rounded-xl text-sm font-bold">
                      {t("browseDeals")}
                    </button>
                    <button className="bg-white/15 text-white px-6 py-2.5 rounded-xl text-sm font-semibold border border-white/30">
                      {t("postRfq")}
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex bg-[#B71C1C] items-center justify-center relative overflow-hidden">
                  <svg viewBox="0 0 200 200" className="w-56 h-56 opacity-25">
                    <rect x="10" y="40" width="180" height="120" rx="14" fill="#fff" />
                    <rect x="30" y="20" width="140" height="90" rx="12" fill="#fff" />
                    <circle cx="100" cy="155" r="14" fill="#fff" />
                    <rect x="65" y="165" width="70" height="12" rx="6" fill="#fff" />
                    <rect x="40" y="60" width="120" height="8" rx="4" fill="#C62828" opacity="0.5" />
                    <rect x="40" y="78" width="80" height="6" rx="3" fill="#C62828" opacity="0.3" />
                  </svg>
                </div>
              </div>
              {/* Hero Dots */}
              <div className="flex justify-center gap-1.5 py-2.5 bg-[#B71C1C]">
                <div className="w-4 h-1.5 bg-white rounded" />
                <div className="w-1.5 h-1.5 bg-white/35 rounded-full" />
                <div className="w-1.5 h-1.5 bg-white/35 rounded-full" />
              </div>
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
            </div>

            {/* Category Stories */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-[#1a1a1a]">Browse categories</span>
                <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("allCount", { count: 42 })} ›</span>
              </div>
              <div className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-1">
                {categories.slice(0, 8).map((cat, i) => (
                  <div key={cat.key} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
                    <div className={`w-[62px] h-[62px] rounded-full p-[2.5px] ${i < 3 ? "bg-gradient-to-br from-[#B71C1C] via-[#FFCA28] to-[#B71C1C]" : "bg-[#e0e0e0]"}`}>
                      <div className="w-full h-full rounded-full border-2.5 border-white flex items-center justify-center overflow-hidden">
                        <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                          <div style={{ color: cat.color }}>{categoryIcons[cat.key]}</div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#444] text-center max-w-16 leading-tight font-medium">{cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Flash Deals */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#B71C1C] rounded-xl flex items-center justify-center">
                    <FireIcon className="w-4.5 h-4.5 text-[#FFCA28]" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#1a1a1a]">{t("flashDeals")}</div>
                    <div className="text-[11px] text-[#888]">{t("flashSub")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CountdownTimer />
                  <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("viewAll")} ›</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {flashDeals.map((deal, i) => (
                  <div key={i} className="bg-[#f9f9f9] rounded-xl overflow-hidden border border-[#ebebeb] cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="h-24 flex items-center justify-center relative" style={{ backgroundColor: deal.bg }}>
                      <div className="absolute top-2 left-2 bg-[#B71C1C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{deal.discount}</div>
                      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                        <rect x="6" y="16" width="44" height="26" rx="5" fill="#EF9F27" opacity="0.4" />
                        <rect x="14" y="8" width="28" height="18" rx="4" fill="#854F0B" opacity="0.55" />
                        <circle cx="18" cy="44" r="4" fill="#854F0B" opacity="0.4" />
                        <circle cx="38" cy="44" r="4" fill="#854F0B" opacity="0.4" />
                      </svg>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-[#222] leading-snug mb-1 line-clamp-2">{deal.name}</div>
                      <div>
                        <span className="text-[15px] font-bold text-[#B71C1C]">{deal.price}</span>
                        <span className="text-[11px] text-[#bbb] line-through ml-1">{deal.orig}</span>
                      </div>
                      <div className="h-1 bg-[#eee] rounded mt-1.5">
                        <div className="h-full bg-[#B71C1C] rounded" style={{ width: `${deal.claimed}%` }} />
                      </div>
                      <div className="text-[10px] text-[#B71C1C] mt-1 font-medium">{deal.claimed}% {t("claimed")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Grid */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-[#1a1a1a]">{t("shopByCategory")}</span>
                <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("allCount", { count: 42 })} ›</span>
              </div>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {categories.map((cat) => (
                  <div key={cat.key} className="flex flex-col items-center gap-1.5 cursor-pointer p-1.5 rounded-lg hover:bg-[#f5f5f5] transition-colors">
                    <div className="w-13 h-13 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.bg }}>
                      <div style={{ color: cat.color }}>{categoryIcons[cat.key]}</div>
                    </div>
                    <span className="text-[10px] text-[#555] text-center leading-tight font-medium">{cat.key.charAt(0).toUpperCase() + cat.key.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Products */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-[#1a1a1a]">{t("trendingNow")}</span>
                <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("viewAll")} ›</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {products.map((product, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden cursor-pointer border border-[#ebebeb] hover:-translate-y-0.5 hover:shadow-md transition-all">
                    <div className="h-32 flex items-center justify-center relative" style={{ backgroundColor: product.bg }}>
                      <div className="absolute top-2 left-2 flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: product.badgeBg, color: product.badgeColor }}>{product.badge}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(i); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                      >
                        <HeartIcon filled={favorites.has(i)} />
                      </button>
                      <svg width="62" height="62" viewBox="0 0 56 56" fill="none">
                        <rect x="7" y="16" width="42" height="26" rx="5" fill="#EF9F27" opacity="0.4" />
                        <rect x="14" y="9" width="28" height="18" rx="4" fill="#854F0B" opacity="0.55" />
                      </svg>
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs text-[#1a1a1a] leading-snug mb-1 line-clamp-2 font-medium">{product.name}</div>
                      <div className="text-[15px] font-bold text-[#B71C1C]">
                        {product.price} <span className="text-[11px] text-[#aaa] font-normal">– {product.range} / unit</span>
                      </div>
                      <div className="text-[11px] text-[#888] mt-0.5">MOQ: {product.moq}</div>
                      <div className="text-[11px] text-[#E65100] mt-0.5">
                        {product.rating} <span className="text-[#999] ml-1 text-[10px]">({product.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f5f5f5]">
                        <span className="text-[10px] text-[#888] truncate flex-1">{product.supplier}</span>
                        <span className="text-[9px] bg-[#E8F5E9] text-[#1B5E20] px-1 py-0.5 rounded font-semibold flex-shrink-0">✓ {t("verified")}</span>
                        <button className="w-6 h-6 bg-[#B71C1C] rounded-lg flex items-center justify-center ml-1.5 flex-shrink-0 cursor-pointer">
                          <PlusIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Banners */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="bg-[#B71C1C] rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-white/70">{t("promoShippingKicker")}</div>
                <div className="text-sm font-bold text-white leading-snug mb-2">{t("promoShipping")}</div>
                <div className="text-xs font-bold text-[#FFCA28] inline-flex items-center gap-0.5">
                  {t("claimNow")} <ArrowRightIcon />
                </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-white/50">{t("promoTermsKicker")}</div>
                <div className="text-sm font-bold text-white leading-snug mb-2">{t("promoTerms")}</div>
                <div className="text-xs font-bold text-[#FFCA28] inline-flex items-center gap-0.5">
                  {t("applyNow")} <ArrowRightIcon />
                </div>
              </div>
              <div className="bg-[#E65100] rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-white/70">{t("promoTrustKicker")}</div>
                <div className="text-sm font-bold text-white leading-snug mb-2">{t("promoTrust")}</div>
                <div className="text-xs font-bold text-white inline-flex items-center gap-0.5">
                  {t("learnMore")} <ArrowRightIcon />
                </div>
              </div>
              <div className="bg-[#1B5E20] rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="text-[10px] font-bold tracking-wider uppercase mb-1 text-white/70">{t("promoNewKicker")}</div>
                <div className="text-sm font-bold text-white leading-snug mb-2">{t("promoNew")}</div>
                <div className="text-xs font-bold text-[#FFCA28] inline-flex items-center gap-0.5">
                  {t("browseAll")} <ArrowRightIcon />
                </div>
              </div>
            </div>

            {/* Suppliers */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[17px] font-bold text-[#1a1a1a]">{t("topSuppliers")}</span>
                <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("directory")} ›</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {suppliers.map((sup) => (
                  <div key={sup.initials} className="bg-white rounded-xl p-3.5 border border-[#ebebeb] hover:shadow-md transition-all cursor-pointer">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold mb-2.5 font-mono" style={{ backgroundColor: sup.bg, color: sup.color }}>
                      {sup.initials}
                    </div>
                    <div className="text-sm font-semibold text-[#1a1a1a] mb-0.5">{sup.name}</div>
                    <div className="text-[11px] text-[#999]">{sup.years} yrs · {sup.products} {t("products")}</div>
                    <div className="text-xs text-[#E65100] mt-1 flex items-center gap-1">
                      ★★★★★ <span className="text-[10px] text-[#999]">{sup.rating} ({sup.reviews})</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sup.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-[#f5f5f5] text-[#555] px-1.5 py-0.5 rounded font-medium">{tag}</span>
                      ))}
                    </div>
                    <button 
                      onClick={() => toggleFollow(sup.initials)}
                      className={`w-full mt-2.5 rounded-lg py-1.5 text-[11px] font-semibold text-center cursor-pointer transition-colors ${
                        followedSuppliers.has(sup.initials) 
                          ? "text-[#B71C1C] bg-[#FFF5F5] border border-[#FFCDD2]" 
                          : "text-[#B71C1C] bg-[#FFF5F5] border border-[#FFCDD2] hover:bg-[#FFEBEE]"
                      }`}
                    >
                      {followedSuppliers.has(sup.initials) ? "Following" : "+ Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* RFQ */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[#ebebeb]">
              <div className="bg-[#B71C1C] px-5 py-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFCA28" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <div className="text-base font-bold text-white">{t("rfqTitle")}</div>
                </div>
                <div className="text-xs text-white/70">{t("rfqSub")}</div>
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#888] font-semibold uppercase tracking-wide">Product / category</label>
                    <input type="text" placeholder="e.g. HEPA filters" className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#B71C1C] focus:bg-white transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#888] font-semibold uppercase tracking-wide">Quantity needed</label>
                    <input type="number" placeholder="e.g. 500" className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#B71C1C] focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#888] font-semibold uppercase tracking-wide">Target unit price ($)</label>
                    <input type="number" placeholder="7.50" className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#B71C1C] focus:bg-white transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#888] font-semibold uppercase tracking-wide">Destination</label>
                    <input type="text" placeholder="Cairo, Egypt" className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#B71C1C] focus:bg-white transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col gap-1 mb-3">
                  <label className="text-[11px] text-[#888] font-semibold uppercase tracking-wide">Requirements (certs, packaging, lead time)</label>
                  <textarea rows={2} placeholder="ISO certified, neutral packaging, 4-week lead…" className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#B71C1C] focus:bg-white transition-colors resize-none" />
                </div>
                <button className="w-full bg-[#B71C1C] text-white rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#C62828] transition-colors cursor-pointer">
                  {t("rfqCta")}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl overflow-hidden border border-[#ebebeb]">
              <div className="px-4 py-3.5 border-b border-[#f5f5f5] flex items-center justify-between">
                <span className="text-[17px] font-bold text-[#1a1a1a]">{t("recentOrders")}</span>
                <span className="text-xs text-[#B71C1C] font-semibold cursor-pointer">{t("viewAll")} ›</span>
              </div>
              <div className="flex border-b border-[#f0f0f0]">
                {["All", "In transit", "Delivered", "RFQs"].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium text-center cursor-pointer border-b-2 transition-colors ${
                      activeTab === tab ? "text-[#B71C1C] border-[#B71C1C]" : "text-[#999] border-transparent"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div>
                {[
                  { id: "#TH-2024-1102", desc: "HEPA 7740 filter × 200 units", date: "Delivered May 10, 2026", amt: "$1,700", status: "Delivered", statusBg: "#E8F5E9", statusColor: "#1B5E20", iconBg: "#E8F5E9", iconColor: "#2E7D32", icon: "check" },
                  { id: "#TH-2024-1089", desc: "Safety harness full-body × 50", date: "ETA May 18, 2026", amt: "$1,125", status: "In transit", statusBg: "#FFF3E0", statusColor: "#E65100", iconBg: "#FFF3E0", iconColor: "#E65100", icon: "truck" },
                  { id: "#TH-2024-1076", desc: "Servo motor 400W × 30 units", date: "Processing since May 13, 2026", amt: "$2,310", status: "Processing", statusBg: "#E3F2FD", statusColor: "#1565C0", iconBg: "#E3F2FD", iconColor: "#1565C0", icon: "clock" },
                ].map((order, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f7f7f7] last:border-b-0 hover:bg-[#fafafa] transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: order.iconBg }}>
                      {order.icon === "check" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={order.iconColor} strokeWidth={1.8}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {order.icon === "truck" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={order.iconColor} strokeWidth={1.8}>
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      )}
                      {order.icon === "clock" && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={order.iconColor} strokeWidth={1.8}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#1a1a1a]">{order.id}</div>
                      <div className="text-xs text-[#999] mt-0.5 truncate">{order.desc}</div>
                      <div className="text-[11px] text-[#bbb] mt-0.5">{order.date}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-[#1a1a1a]">{order.amt}</div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1" style={{ backgroundColor: order.statusBg, color: order.statusColor }}>{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Membership Card */}
            <div className="bg-[#1a1a1a] rounded-2xl p-5 relative overflow-hidden cursor-pointer">
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#B71C1C] rounded-full opacity-30" />
              <div className="absolute -bottom-9 -left-3 w-24 h-24 bg-[#FFCA28] rounded-full opacity-10" />
              <div className="relative z-10">
                <div className="text-[10px] text-[#FFCA28] font-bold tracking-wider mb-2">✦ GOLD MEMBERSHIP</div>
                <div className="text-xl font-bold text-white mb-1">Welcome back, Ahmed!</div>
                <div className="text-xs text-white/55 mb-4">You have 4,200 trade points to redeem</div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div><div className="text-base font-bold text-[#FFCA28]">12%</div><div className="text-[10px] text-white/50 mt-0.5">Extra discount</div></div>
                  <div><div className="text-base font-bold text-[#FFCA28]">Free</div><div className="text-[10px] text-white/50 mt-0.5">Priority freight</div></div>
                  <div><div className="text-base font-bold text-[#FFCA28]">Net-60</div><div className="text-[10px] text-white/50 mt-0.5">Payment terms</div></div>
                  <div><div className="text-base font-bold text-[#FFCA28]">24/7</div><div className="text-[10px] text-white/50 mt-0.5">Trade support</div></div>
                </div>
                <button className="w-full bg-[#FFCA28] text-[#7B1A1A] py-2.5 rounded-lg text-sm font-bold relative z-10 cursor-pointer">
                  {t("redeem")} 4,200 Points
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-bold text-[#1a1a1a]">Account overview</span>
              </div>
              {[
                { label: "Total orders", val: "47", iconBg: "#FFEBEE", iconColor: "#B71C1C", icon: "bag" },
                { label: "Delivered", val: "41", iconBg: "#E8F5E9", iconColor: "#2E7D32", icon: "check" },
                { label: "In transit", val: "4", iconBg: "#FFF3E0", iconColor: "#E65100", icon: "truck" },
                { label: "Active RFQs", val: "2", iconBg: "#E3F2FD", iconColor: "#1565C0", icon: "file" },
                { label: "Total spent", val: "$38,420", iconBg: "#F3E5F5", iconColor: "#6A1B9A", icon: "dollar" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#f5f5f5] last:border-b-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: stat.iconBg }}>
                    {stat.icon === "bag" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth={1.8}>
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    )}
                    {stat.icon === "check" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth={1.8}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {stat.icon === "truck" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth={1.8}>
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                    )}
                    {stat.icon === "file" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth={1.8}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {stat.icon === "dollar" && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stat.iconColor} strokeWidth={1.8}>
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-xs text-[#888] font-medium">{stat.label}</span>
                  <span className="text-xs font-bold text-[#1a1a1a]">{stat.val}</span>
                </div>
              ))}
            </div>

            {/* Trending Searches */}
            <div className="bg-white rounded-xl p-4 border border-[#ebebeb]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-bold text-[#1a1a1a]">Trending searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trending.map((t, i) => (
                  <div 
                    key={i} 
                    className={`rounded-full px-3 py-1.5 text-[11px] cursor-pointer flex items-center gap-1 transition-colors ${
                      t.fire ? "bg-[rgba(255,202,40,0.15)] text-[#996B00]" : "bg-[#f5f5f5] text-[#555] hover:bg-[#FFEBEE] hover:text-[#B71C1C]"
                    }`}
                  >
                    {t.fire && <FireIcon className="w-2.5 h-2.5" />}
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
