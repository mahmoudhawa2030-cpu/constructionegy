import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CreateRedirectForm, DeleteRedirectForm, EditRedirectForm } from "@/components/admin/redirect-forms";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  await requireAdmin();
  const t = await getTranslations("adminRedirects");
  const supabase = await createClient();
  const { source } = await searchParams;

  const { data } = await supabase
    .from("redirects")
    .select("id, source_path, destination_path, status_code, is_active, hit_count, created_at")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={adminUi.linkBack} href="/admin/not-found-log">
            {t("notFoundLink")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("back")}
          </Link>
        </div>
      </div>

      <CreateRedirectForm initialSource={source} />

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("listTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={`${adminUi.table} min-w-[52rem]`}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colHits")}</th>
                  <th className={adminUi.th}></th>
                  <th className={adminUi.th}>{t("colRedirect")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={`${adminUi.tbodyRow} align-middle`}>
                    <td className={`${adminUi.td} whitespace-nowrap text-center tabular-nums`}>
                      {new Intl.NumberFormat("en-US").format(row.hit_count)}
                    </td>
                    <td className={adminUi.td}>
                      <DeleteRedirectForm id={row.id} />
                    </td>
                    <td className={adminUi.td}>
                      <EditRedirectForm row={row} />
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
