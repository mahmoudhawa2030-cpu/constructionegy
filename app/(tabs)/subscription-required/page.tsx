import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { featureLabel } from "@/lib/subscriptions/features";
import { getSubscriptionServicesOrdered } from "@/lib/subscriptions/services-queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ feature?: string | string[] }>;
};

const KEY_RE = /^[a-z][a-z0-9_]*$/;

function parseFeatureKey(raw: string | string[] | undefined): string | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s || !KEY_RE.test(s)) return null;
  return s;
}

export default async function SubscriptionRequiredPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const featureKey = parseFeatureKey(sp.feature);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = featureKey
      ? `/subscription-required?feature=${encodeURIComponent(featureKey)}`
      : "/subscription-required";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const locale = await getLocale();
  const loc = locale === "en" ? "en" : "ar";
  const t = await getTranslations("subscriptionRequired");

  const services = await getSubscriptionServicesOrdered();
  const listForUi = services.filter((s) => s.feature_key !== "all");

  const row = featureKey ? services.find((s) => s.feature_key === featureKey) : null;
  const featureTitle = row
    ? loc === "en"
      ? row.label_en
      : row.label_ar
    : featureKey
      ? featureLabel(featureKey, loc)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
        {t("title")}
      </h1>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {featureTitle ? t("bodyWithFeature", { feature: featureTitle }) : t("bodyGeneric")}
      </p>
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">{t("hintAdmin")}</p>
      <ul className="list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
        {listForUi.length > 0
          ? listForUi.map((s) => (
              <li key={s.feature_key}>{loc === "en" ? s.label_en : s.label_ar}</li>
            ))
          : ["rfq", "live_map", "premium_listings"].map((k) => (
              <li key={k}>{featureLabel(k, loc)}</li>
            ))}
      </ul>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          href="/"
        >
          {t("ctaHome")}
        </Link>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
          href="/profile"
        >
          {t("ctaProfile")}
        </Link>
      </div>
    </div>
  );
}
