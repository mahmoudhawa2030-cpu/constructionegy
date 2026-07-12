import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DismissNotFoundForm, DeleteNotFoundForm } from "@/components/admin/not-found-forms";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminNotFoundLogPage() {
  await requireAdmin();
  const t = await getTranslations("adminNotFound");
  const supabase = await createClient();

  const { data } = await supabase
    .from("not_found_log")
    .select("id, path, referrer, hit_count, first_seen_at, last_seen_at, ignored")
    .eq("ignored", false)
    .order("hit_count", { ascending: false })
    .limit(200);

  const rows = data ?? [];

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={adminUi.linkBack} href="/admin/redirects">
            {t("redirectsLink")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("back")}
          </Link>
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("listTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={`${adminUi.table} min-w-[52rem]`}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colHits")}</th>
                  <th className={adminUi.th}>{t("colLastSeen")}</th>
                  <th className={adminUi.th}>{t("colPath")}</th>
                  <th className={adminUi.th}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={`${adminUi.tbodyRow} align-middle`}>
                    <td className={`${adminUi.td} whitespace-nowrap text-center tabular-nums`}>
                      {new Intl.NumberFormat("en-US").format(row.hit_count)}
                    </td>
                    <td className={`${adminUi.td} ${adminUi.tdMuted} whitespace-nowrap text-xs`}>
                      {new Date(row.last_seen_at).toLocaleString()}
                    </td>
                    <td className={adminUi.td}>
                      <span className={`${adminUi.code} break-all`} dir="ltr">
                        {row.path}
                      </span>
                      {row.referrer ? (
                        <div className="mt-1 truncate text-xs text-[var(--admin-text-secondary)]" dir="ltr" title={row.referrer}>
                          {t("referredBy")}: {row.referrer}
                        </div>
                      ) : null}
                    </td>
                    <td className={adminUi.td}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className={`${adminUi.btnSecondary} shrink-0`}
                          href={`/admin/redirects?source=${encodeURIComponent(row.path)}`}
                        >
                          {t("createRedirect")}
                        </Link>
                        <DismissNotFoundForm id={row.id} />
                        <DeleteNotFoundForm id={row.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rows.length === 0 ? <p className="text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p> : null}
    </div>
  );
}
