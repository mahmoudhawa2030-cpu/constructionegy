"use client";

import { useTranslations } from "next-intl";

import type { ListingScore } from "@/lib/seo/listing-score";

const gradeColor: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  B: "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  C: "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  D: "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100",
  F: "bg-red-100 text-red-900 dark:bg-red-950/40 dark:text-red-100",
};

type Props = {
  score: ListingScore;
};

export function ListingSeoScore({ score }: Props) {
  const t = useTranslations("listingSeoScore");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{t("label")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {score.percentage}
            <span className="text-sm font-medium text-zinc-500">/100</span>
          </p>
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
            gradeColor[score.grade] ?? gradeColor.C
          }`}
          title={t("gradeTitle", { grade: score.grade })}
        >
          {score.grade}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-[var(--admin-brand)]"
          style={{ width: `${score.percentage}%` }}
        />
      </div>
      {score.suggestions.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {score.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
