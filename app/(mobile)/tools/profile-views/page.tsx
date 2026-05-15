import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { AvatarImage } from "@/components/avatar-image";
import { VerifiedBadge } from "@/components/verified-badge";
import { ExpertBadge } from "@/components/expert-badge";
import { getProfileViewers } from "@/lib/profile/record-view";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfileViewsPage() {
  const t = await getTranslations("profileViews");
  const tExpert = await getTranslations("expertVerification");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="text-5xl" aria-hidden>👁</span>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("loginRequired")}</p>
        <Link
          href="/login?next=/tools/profile-views"
          className="mt-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("loginRequired")}
        </Link>
      </div>
    );
  }

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "ar";
  const dateLocale = locale === "en" ? "en-GB" : "ar-EG";

  const result = await getProfileViewers(50, 0);

  // If the RPC doesn't exist yet (migration not applied) treat as empty list.
  const viewers = result.ok ? result.viewers : [];
  const loadFailed = !result.ok;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
        {viewers.length > 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            {t("totalViews", { count: viewers.length })}
          </p>
        ) : null}
      </div>

      {loadFailed ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {t("loadError")}
        </p>
      ) : null}

      {viewers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-5xl" aria-hidden>👁</span>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("empty")}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">{t("emptyHint")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {viewers.map((v) => {
            const name = v.full_name ?? "—";
            const isVerifiedBusiness = v.business_verification_status === "verified";
            const isExpert = v.expert_verification_status === "verified";
            const roleLabel =
              v.user_type === "supplier" ? t("supplier") : t("contractor");
            const viewedDate = new Date(v.viewed_at).toLocaleDateString(dateLocale);

            return (
              <li key={v.viewer_id}>
                <Link
                  href={`/profile/${v.viewer_id}`}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <AvatarImage src={v.avatar_url} name={name} size="sm" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {name}
                      </span>
                      {isVerifiedBusiness ? (
                        <VerifiedBadge label={t("verifiedBusiness")} sizePx={16} />
                      ) : null}
                      {isExpert ? (
                        <ExpertBadge
                          ariaLabel={tExpert("badgeAria")}
                          text={tExpert("badgeShort")}
                          className="text-xs"
                        />
                      ) : null}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{roleLabel}</p>
                  </div>

                  <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                    {t("viewedAt", { date: viewedDate })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
