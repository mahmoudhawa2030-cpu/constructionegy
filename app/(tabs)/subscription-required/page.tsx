import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { featureLabel, type SubscriptionFeature } from "@/lib/subscriptions/features";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ feature?: string | string[] }>;
};

const GATED: SubscriptionFeature[] = ["rfq", "live_map", "premium_listings"];

function parseFeature(raw: string | string[] | undefined): SubscriptionFeature | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s === "rfq" || s === "live_map" || s === "premium_listings") return s;
  return null;
}

export default async function SubscriptionRequiredPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const feature = parseFeature(sp.feature);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const nextPath = feature
      ? `/subscription-required?feature=${feature}`
      : "/subscription-required";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  const locale = await getLocale();
  const loc = locale === "en" ? "en" : "ar";
  const t = await getTranslations("subscriptionRequired");

  const featureTitle = feature ? featureLabel(feature, loc) : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 sm:text-2xl">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {featureTitle ? t("bodyWithFeature", { feature: featureTitle }) : t("bodyGeneric")}
      </p>
      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">{t("hintAdmin")}</p>
      <ul className="list-inside list-disc text-xs text-zinc-500 dark:text-zinc-400">
        {GATED.map((f) => (
          <li key={f}>{featureLabel(f, loc)}</li>
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
