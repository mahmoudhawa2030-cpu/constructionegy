"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Category = {
  slug: string;
  label_ar: string;
  label_en: string;
  icon: string | null;
};

type Props = {
  categories: Category[];
};

const DEFAULT_ICONS: Record<string, string> = {
  "construction-materials": "🏗️",
  "electrical": "⚡",
  "plumbing": "🔧",
  "hvac": "❄️",
  "safety": "🦺",
  "tools": "🛠️",
  "flooring": "🏛️",
  "lighting": "💡",
  "doors-windows": "🚪",
};

export function WebCategories({ categories }: Props) {
  const t = useTranslations("categories");
  const locale = useLocale();

  if (!categories.length) {
    return <p className="text-[var(--bina-muted)]">{t("noCategories")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((cat) => {
        const label = locale === "ar" ? cat.label_ar : cat.label_en;
        const icon = cat.icon || DEFAULT_ICONS[cat.slug] || "📦";

        return (
          <Link
            key={cat.slug}
            href={`/gallery?category=${cat.slug}`}
            className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--bina-border)] bg-white p-4 transition-all hover:border-[var(--bina-primary)] hover:shadow-md"
          >
            <span className="text-3xl transition-transform group-hover:scale-110">{icon}</span>
            <span className="text-center text-sm font-medium text-[var(--bina-text)] line-clamp-2">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
