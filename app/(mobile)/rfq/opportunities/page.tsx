import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { canAccessFeature } from "@/lib/subscriptions/can-access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RfqOpportunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/rfq/opportunities")}`);
  }

  if (!(await canAccessFeature(user.id, "rfq"))) {
    redirect("/subscription-required?feature=rfq");
  }

  const t = await getTranslations("rfqOpportunity");

  const { data: rows, error } = await supabase
    .from("rfq_drafts")
    .select(
      "id, title, status, updated_at, user_id, profiles!rfq_drafts_user_id_fkey ( id, full_name )",
    )
    .in("status", ["submitted", "open_for_bids"])
    .neq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-3 py-5 sm:px-4 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {t("listTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("listSubtitle")}</p>
        </div>
        <Link
          className="text-sm font-medium text-zinc-800 underline dark:text-zinc-200"
          href="/rfq"
          prefetch={true}
        >
          {t("backToMyRfqs")}
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      ) : !rows?.length ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label={t("listAria")}>
          {rows.map((r) => {
            const profile = r.profiles as { id: string; full_name: string | null } | null;
            const creatorName = profile?.full_name?.trim() || t("creatorFallbackName");
            return (
              <li key={r.id}>
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                  <Link
                    className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    href={`/rfq/opportunities/${r.id}`}
                    prefetch={true}
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {r.title?.trim() || t("untitled")}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                      {t("updated")}{" "}
                      {new Date(r.updated_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </Link>
                  <div className="border-t border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("postedByLabel")} </span>
                    <Link
                      className="text-xs font-medium text-zinc-800 underline dark:text-zinc-200"
                      href={`/profile/${r.user_id}`}
                      prefetch={true}
                      aria-label={t("viewCreatorProfileAria", { name: creatorName })}
                    >
                      {creatorName}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
