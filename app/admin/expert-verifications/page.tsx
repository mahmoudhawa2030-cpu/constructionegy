import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  full_name: string;
  expert_verification_status: string;
  expert_verification_reviewed_at: string | null;
};

export default async function AdminExpertVerificationsListPage() {
  const t = await getTranslations("adminExpertVerifications.list");
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, full_name, expert_verification_status, expert_verification_reviewed_at")
    .eq("expert_verification_status", "pending")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className={adminUi.page}>
        <p className="text-sm text-red-600 dark:text-red-400">
          {t("loadError")}: {error.message}
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as Row[];

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>{t("title")}</h1>
        <p className={adminUi.pageLead}>{t("lead")}</p>
      </div>
      <Link className={adminUi.linkBack} href="/admin">
        {t("back")}
      </Link>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("tableTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={adminUi.table}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colUser")}</th>
                  <th className={adminUi.th}>{t("colReviewed")}</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr className={adminUi.tbodyRow}>
                    <td className={adminUi.tdMuted} colSpan={2}>
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.id} className={adminUi.tbodyRow}>
                      <td className={adminUi.td}>
                        <Link className="font-semibold text-[var(--admin-brand)] hover:underline" href={`/admin/expert-verifications/${r.id}`}>
                          {r.full_name?.trim() || "—"}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr">
                          {r.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                        {r.expert_verification_reviewed_at ? new Date(r.expert_verification_reviewed_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
