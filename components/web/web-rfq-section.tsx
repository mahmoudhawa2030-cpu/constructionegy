"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function WebRfqSection() {
  const t = useTranslations("rfq");

  const benefits = [
    { icon: "📊", text: t("rfqBenefit1") },
    { icon: "🎯", text: t("rfqBenefit2") },
    { icon: "⚡", text: t("rfqBenefit3") },
  ];

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[var(--bina-border)] bg-gradient-to-br from-[var(--bina-steel)] to-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="max-w-lg">
        <h2 className="font-bina-display text-xl font-bold text-[var(--bina-text)] sm:text-2xl">
          {t("rfqSectionTitle")}
        </h2>
        <p className="mt-2 text-sm text-[var(--bina-muted)]">
          {t("rfqSectionSubtitle")}
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--bina-text)]">
              <span>{benefit.icon}</span>
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
      <Link
        href="/rfq"
        className="rounded-lg bg-[var(--bina-primary)] px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--bina-primary-dark)]"
      >
        {t("postRfqNow")}
      </Link>
    </div>
  );
}
