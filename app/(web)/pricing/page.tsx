"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  Shield,
  Check,
  X,
  ChevronDown,
  Lock,
  Home,
  Zap,
  Crown,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const t = useTranslations("pricing");
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const prices = {
    gold: { monthly: 129, annual: 103 },
    plat: { monthly: 399, annual: 319 },
  };

  const toggleBilling = () => setIsAnnual(!isAnnual);
  const setBilling = (mode: "monthly" | "annual") => setIsAnnual(mode === "annual");
  const toggleFaq = (index: number) => setOpenFaq(openFaq === index ? null : index);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-10 pt-16 text-center">
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-[300px] w-[500px] -translate-x-1/2"
          style={{
            background: "radial-gradient(circle, rgba(183,28,28,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,202,40,0.25)] bg-[rgba(255,202,40,0.12)] px-3.5 py-1.5">
          <Star className="h-3 w-3 text-[#FFCA28]" fill="#FFCA28" />
          <span className="font-semibold text-[11px] uppercase tracking-wide text-[#FFCA28]">
            {t("eyebrow")}
          </span>
        </div>

        <h1 className="mx-auto mt-4 max-w-md font-sans text-2xl font-extrabold leading-tight tracking-tight text-white">
          {t("title")}
        </h1>

        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/55">
          {t("subtitle")}
        </p>

        <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-2">
          <TierBadge label={`${t("bronzeTier")} — ${t("free")}`} variant="default" />
          <TierBadge label={`${t("silverTier")} — $49 / ${t("monthly")}`} variant="default" />
          <TierBadge label={`★ ${t("goldTier")} — $129 / ${t("monthly")}`} variant="gold" />
          <TierBadge label={`${t("platinumTier")} — $399 / ${t("monthly")}`} variant="default" />
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="flex items-center justify-center gap-2.5 py-3">
        <button
          onClick={() => setBilling("monthly")}
          className={`font-sans text-[13px] font-semibold transition-colors ${!isAnnual ? "text-white" : "text-white/40"}`}
        >
          {t("monthly")}
        </button>

        <button
          onClick={toggleBilling}
          className={`relative h-[25px] w-[48px] rounded-full border transition-colors ${isAnnual ? "border-[#B71C1C] bg-[#B71C1C]" : "border-white/15 bg-white/10"}`}
          aria-label="Toggle billing period"
        >
          <span
            className={`absolute top-[3px] left-[3px] h-[17px] w-[17px] rounded-full bg-white transition-transform ${isAnnual ? "translate-x-[23px]" : ""}`}
          />
        </button>

        <button
          onClick={() => setBilling("annual")}
          className={`font-sans text-[13px] font-semibold transition-colors ${isAnnual ? "text-white" : "text-white/40"}`}
        >
          {t("annual")}
        </button>

        <span className="rounded-full border border-[rgba(183,28,28,0.4)] bg-[rgba(183,28,28,0.2)] px-2.5 py-0.5 font-sans text-[11px] font-bold text-[#ff8a80]">
          {t("savePercent")}
        </span>
      </section>

      {/* Pricing Cards */}
      <section className="grid gap-3.5 px-5 pb-8 md:grid-cols-3">
        {/* Bronze Card */}
        <PricingCard
          icon={<Clock className="h-5 w-5 text-white/50" />}
          name={t("bronzeTier")}
          tagline="Start buying wholesale with no commitment"
          price="0"
          period={t("free")}
          cta={t("getStarted")}
          variant="default"
          features={[
            { text: t("features.catalog"), included: true },
            { text: t("features.pricing"), included: true },
            { text: t("features.rfqs", { count: 5 }), included: true },
            { text: t("features.checkout"), included: true },
            { text: "No volume discounts", included: false },
            { text: "No Net-30 terms", included: false },
            { text: "No dedicated support", included: false },
          ]}
        />

        {/* Gold Card - Featured */}
        <PricingCard
          popular
          icon={<Star className="h-5 w-5 text-[#FFCA28]" fill="#FFCA28" />}
          name={t("goldTier")}
          nameColor="#FFCA28"
          tagline="The complete wholesale toolkit for growing businesses"
          price={isAnnual ? prices.gold.annual.toString() : prices.gold.monthly.toString()}
          period={t("perMonth")}
          cta="Start Gold membership"
          variant="gold"
          onCta={() => router.push("/subscription-required")}
          features={[
            { text: `Everything in Silver`, included: true },
            { text: t("features.discount", { percent: "12%" }), included: true, highlight: true },
            { text: t("features.unlimitedRfqs"), included: true },
            { text: t("features.paymentTerms", { days: 60 }), included: true },
            { text: t("features.priorityFreight", { count: 10 }), included: true },
            { text: t("features.accountManager"), included: true },
            { text: t("features.tradePoints", { count: "4,200" }), included: true },
            { text: t("features.earlyAccess"), included: true },
          ]}
          billingNote={
            isAnnual
              ? t("billedYearly", { amount: "$312" })
              : t("billedMonthly")
          }
        />

        {/* Platinum Card */}
        <PricingCard
          icon={<Shield className="h-5 w-5 text-[#E53935]" />}
          name={t("platinumTier")}
          nameColor="#ff8a80"
          tagline="Enterprise-grade trade for high-volume buyers"
          price={isAnnual ? prices.plat.annual.toString() : prices.plat.monthly.toString()}
          period={t("perMonth")}
          cta="Start Platinum membership"
          variant="red"
          onCta={() => router.push("/subscription-required")}
          features={[
            { text: `Everything in Gold`, included: true },
            { text: t("features.discount", { percent: "22%" }), included: true, highlight: true },
            { text: t("features.paymentTerms", { days: 90 }), included: true },
            { text: t("features.whiteGlove"), included: true },
            { text: t("features.customSourcing"), included: true },
            { text: t("features.api"), included: true },
            { text: t("features.tradePoints", { count: "15,000" }), included: true },
            { text: t("features.sla"), included: true },
          ]}
          billingNote={
            isAnnual
              ? t("billedYearly", { amount: "$960" })
              : t("billedMonthly")
          }
        />
      </section>

      {/* Comparison Table */}
      <section className="px-5 pb-10">
        <div className="mb-5 text-center">
          <h2 className="font-sans text-xl font-extrabold tracking-tight text-white">
            {t("comparison")}
          </h2>
          <p className="mt-1.5 text-[12px] text-white/40">{t("comparisonSubtitle")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr>
                <th className="border-b border-white/10 px-3 py-2.5 text-left font-sans text-[11px] font-bold uppercase tracking-wider text-white/30">
                  Feature
                </th>
                <th className="border-b border-white/10 px-3 py-2.5 text-center font-sans text-[11px] font-bold uppercase tracking-wider text-white/45">
                  {t("bronzeTier")}
                </th>
                <th className="border-b border-white/10 px-3 py-2.5 text-center font-sans text-[11px] font-bold uppercase tracking-wider text-white/45">
                  {t("silverTier")}
                </th>
                <th className="border-b-2 border-[rgba(255,202,40,0.35)] bg-[rgba(255,202,40,0.06)] px-3 py-2.5 text-center font-sans text-[11px] font-bold uppercase tracking-wider text-[#FFCA28]">
                  {t("goldTier")} ★
                </th>
                <th className="border-b border-white/10 px-3 py-2.5 text-center font-sans text-[11px] font-bold uppercase tracking-wider text-white/45">
                  {t("platinumTier")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableRow feature="Product catalog" bronze="50K+" silver="50K+" gold="50K+ priority" platinum="50K+ + custom" goldHighlight />
              <TableRow feature="Volume discount" bronze="—" silver="5%" gold="12%" platinum="22%" goldHighlight />
              <TableRow feature="Monthly RFQs" bronze="5" silver="25" gold="Unlimited" platinum="Unlimited" goldHighlight />
              <TableRow feature="Payment terms" bronze="—" silver="Net-30" gold="Net-60" platinum="Net-90" goldHighlight />
              <TableRow feature="Priority freight" bronze="—" silver="—" gold={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} platinum={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} goldHighlight />
              <TableRow feature="Account manager" bronze="—" silver="—" gold={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} platinum={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} goldHighlight />
              <TableRow feature="Trade points / month" bronze="None" silver="500 pts" gold="4,200 pts" platinum="15,000 pts" goldHighlight />
              <TableRow feature="Flash deal early access" bronze="—" silver="—" gold={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} platinum={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} goldHighlight />
              <TableRow feature="API / ERP integration" bronze="—" silver="—" gold="—" platinum={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} />
              <TableRow feature="Custom sourcing" bronze="—" silver="—" gold="—" platinum={<Check className="mx-auto h-4 w-4 text-[#66BB6A]" />} />
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-5 pb-9">
        <div className="mb-5 text-center">
          <h2 className="font-sans text-xl font-extrabold tracking-tight text-white">
            {t("testimonials")}
          </h2>
          <p className="mt-1.5 text-[12px] text-white/40">{t("testimonialsSubtitle")}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <TestimonialCard
            initials="AK"
            name="Ahmed Karim"
            role="Procurement Dir. · Cairo Industrials"
            avatarBg="rgba(255,202,40,0.15)"
            avatarColor="#FFCA28"
            text='"Switching to Gold saved us $28,000 in the first quarter. The Net-60 terms alone changed how we manage cash flow."'
          />
          <TestimonialCard
            initials="SL"
            name="Sara Li"
            role="COO · FastBuild Materials, Dubai"
            avatarBg="rgba(183,28,28,0.2)"
            avatarColor="#ff8a80"
            text='"The dedicated account manager found us three new suppliers that cut our lead times by 40%. Worth every cent."'
          />
          <TestimonialCard
            initials="MO"
            name="Mohamed Osman"
            role="Founder · NileSupply Co."
            avatarBg="rgba(27,94,32,0.2)"
            avatarColor="#66BB6A"
            text='"Early flash deal access means we always get the best prices. Our margins improved by 18% year-over-year."'
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl px-5 pb-9">
        <div className="mb-5 text-center">
          <h2 className="font-sans text-xl font-extrabold tracking-tight text-white">
            {t("faq")}
          </h2>
          <p className="mt-1.5 text-[12px] text-white/40">{t("faqSubtitle")}</p>
        </div>

        <div className="space-y-2">
          <FaqItem
            question={t("faqChangeTier")}
            answer={t("faqChangeTierAnswer")}
            isOpen={openFaq === 0}
            onToggle={() => toggleFaq(0)}
          />
          <FaqItem
            question={t("faqPaymentTerms", { days: "30/60/90" })}
            answer={t("faqPaymentTermsAnswer")}
            isOpen={openFaq === 1}
            onToggle={() => toggleFaq(1)}
          />
          <FaqItem
            question={t("faqTradePoints")}
            answer={t("faqTradePointsAnswer", { points: "1,000", value: "10" })}
            isOpen={openFaq === 2}
            onToggle={() => toggleFaq(2)}
          />
          <FaqItem
            question={t("faqMinimum")}
            answer={t("faqMinimumAnswer")}
            isOpen={openFaq === 3}
            onToggle={() => toggleFaq(3)}
          />
          <FaqItem
            question={t("faqAnnual")}
            answer={t("faqAnnualAnswer")}
            isOpen={openFaq === 4}
            onToggle={() => toggleFaq(4)}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-xl px-5 pb-12 text-center">
        <div className="rounded-[22px] border border-[rgba(255,202,40,0.2)] bg-[#111] p-7">
          <div className="mx-auto mb-3.5 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#FFCA28] to-[#F9A825]">
            <Crown className="h-6 w-6 text-[#5D4037]" />
          </div>
          <h2 className="font-sans text-[22px] font-extrabold tracking-tight text-white">
            {t("readyTitle")}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">
            {t("readySubtitle")}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => router.push("/subscription-required")}
              className="rounded-lg bg-gradient-to-br from-[#FFCA28] to-[#F9A825] px-6 py-3 font-sans text-[13px] font-bold text-[#5D4037] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {t("startTrial")}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-white/15 px-6 py-3 font-sans text-[13px] font-semibold text-white/55 transition-all hover:border-white/30 hover:text-white active:scale-[0.98]"
            >
              {t("maybeLater")}
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/40">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              {t("trust.noCard")}
            </span>
            <span className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              {t("trust.cancel")}
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {t("trust.assurance")}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// Components

function TierBadge({ label, variant }: { label: string; variant: "default" | "gold" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 font-sans text-[11px] font-semibold ${
        variant === "gold"
          ? "bg-[rgba(255,202,40,0.12)] text-[#FFCA28]"
          : "bg-white/7 text-white/65"
      }`}
    >
      {label}
    </span>
  );
}

interface Feature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PricingCardProps {
  icon: React.ReactNode;
  name: string;
  nameColor?: string;
  tagline: string;
  price: string;
  period: string;
  cta: string;
  variant: "default" | "gold" | "red";
  features: Feature[];
  popular?: boolean;
  billingNote?: string;
  onCta?: () => void;
}

function PricingCard({
  icon,
  name,
  nameColor,
  tagline,
  price,
  period,
  cta,
  variant,
  features,
  popular,
  billingNote,
  onCta,
}: PricingCardProps) {
  const isGold = variant === "gold";

  return (
    <div
      className={`relative rounded-[20px] border p-5 transition-all ${
        isGold
          ? "border-[rgba(255,202,40,0.4)] bg-[#161616]"
          : "border-white/8 bg-[#111] hover:border-white/16"
      }`}
    >
      {popular && (
        <div className="absolute right-3.5 top-3.5 rounded-full bg-gradient-to-br from-[#FFCA28] to-[#F9A825] px-2 py-0.5 font-sans text-[10px] font-bold text-[#5D4037]">
          Most popular
        </div>
      )}

      {isGold && (
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-[20px] bg-gradient-to-r from-[#FFCA28] via-[#F9A825] to-[#FFCA28]" />
      )}

      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
          variant === "gold" ? "bg-[rgba(255,202,40,0.12)]" : variant === "red" ? "bg-[rgba(183,28,28,0.15)]" : "bg-white/6"
        }`}
      >
        {icon}
      </div>

      <div
        className="mb-0.5 font-sans text-[13px] font-bold uppercase tracking-wide"
        style={{ color: nameColor || "rgba(255,255,255,0.8)" }}
      >
        {name}
      </div>

      <p className="mb-4 text-[11px] leading-snug text-white/35">{tagline}</p>

      <div className="mb-0.5 flex items-baseline gap-1">
        <span className={`font-sans text-lg font-bold ${isGold ? "text-[#FFCA28]" : variant === "red" ? "text-[#ff8a80]" : "text-white/60"}`}>$</span>
        <span className="font-sans text-4xl font-extrabold tracking-tighter text-white">{price}</span>
      </div>

      <div className="text-[12px] text-white/35">{period}</div>
      <div className="mb-4 min-h-3.5 text-[10px] text-white/22">{billingNote || "\u00A0"}</div>

      <button
        onClick={onCta}
        className={`mb-4 w-full rounded-lg py-2.5 font-sans text-[12px] font-bold transition-all active:scale-[0.98] ${
          variant === "gold"
            ? "bg-gradient-to-br from-[#FFCA28] to-[#F9A825] text-[#5D4037]"
            : variant === "red"
            ? "bg-gradient-to-br from-[#E53935] to-[#B71C1C] text-white"
            : "border border-white/12 bg-white/6 text-white/75 hover:bg-white/10"
        }`}
      >
        {cta}
      </button>

      <div className="mb-3.5 border-t border-white/7" />

      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className={`flex items-start gap-2 text-[11px] ${f.included ? "text-white/78" : "text-white/45"}`}>
            <span
              className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                f.included ? "bg-[rgba(27,94,32,0.3)] text-[#66BB6A]" : "bg-white/6 text-white/20"
              }`}
            >
              {f.included ? "✓" : "✕"}
            </span>
            <span dangerouslySetInnerHTML={{ __html: f.text }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRow({
  feature,
  bronze,
  silver,
  gold,
  platinum,
  goldHighlight,
}: {
  feature: string;
  bronze: React.ReactNode;
  silver: React.ReactNode;
  gold: React.ReactNode;
  platinum: React.ReactNode;
  goldHighlight?: boolean;
}) {
  return (
    <tr className="border-b border-white/4 hover:bg-white/[0.02]">
      <td className="px-3 py-2.5 text-left text-[12px] font-medium text-white/70">{feature}</td>
      <td className="px-3 py-2.5 text-center text-[12px] text-white/50">{bronze}</td>
      <td className="px-3 py-2.5 text-center text-[12px] text-white/50">{silver}</td>
      <td className={`px-3 py-2.5 text-center text-[12px] ${goldHighlight ? "bg-[rgba(255,202,40,0.04)] font-sans font-bold text-[#FFCA28]" : "bg-[rgba(255,202,40,0.04)] text-white/50"}`}>{gold}</td>
      <td className="px-3 py-2.5 text-center text-[12px] text-white/50">{platinum}</td>
    </tr>
  );
}

function TestimonialCard({
  initials,
  name,
  role,
  avatarBg,
  avatarColor,
  text,
}: {
  initials: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarColor: string;
  text: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/7 bg-[#111] p-4">
      <div className="mb-2 text-[12px] text-[#FFCA28]">★★★★★</div>
      <p className="mb-3 text-[12px] italic leading-relaxed text-white/55">{text}</p>
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full font-sans text-[10px] font-bold"
          style={{ background: avatarBg, color: avatarColor }}
        >
          {initials}
        </div>
        <div>
          <div className="font-sans text-[11px] font-bold text-white/80">{name}</div>
          <div className="text-[10px] text-white/35">{role}</div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[11px] border border-white/7">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]">
        <span className="font-sans text-[12px] font-semibold text-white">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/35 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden px-4 text-[12px] leading-relaxed text-white/50 transition-all ${
          isOpen ? "max-h-48 pb-3 pt-0" : "max-h-0"
        }`}
      >
        {answer}
      </div>
    </div>
  );
}
