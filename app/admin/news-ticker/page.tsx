import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { deleteNewsTicker, toggleNewsTicker } from "@/app/admin/news-ticker/actions";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { listNewsTickersAdmin } from "@/lib/news-ticker/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNewsTickerPage() {
  await requireAdmin();
  const t = await getTranslations("adminNewsTicker");
  const supabase = await createClient();

  let tickers: Awaited<ReturnType<typeof listNewsTickersAdmin>> = [];
  let loadError: string | null = null;
  try {
    tickers = await listNewsTickersAdmin(supabase);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "load_failed";
  }

  return (
    <div className={adminUi.page}>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link className={adminUi.linkBack} href="/admin">
            {t("back")}
          </Link>
          <h1 className={adminUi.pageTitle}>{t("pageTitle")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <Link className={`${adminUi.btnPrimary} no-underline`} href="/admin/news-ticker/new">
          {t("newTicker")}
        </Link>
      </div>

      {loadError ? (
        <div className={`${adminUi.cardPadded} text-sm text-red-600`}>
          {t("loadError")}: {loadError}
          <p className="mt-2 text-[var(--admin-text-secondary)]">{t("runMigrationHint")}</p>
        </div>
      ) : null}

      {!loadError && tickers.length === 0 ? (
        <div className={adminUi.cardPadded}>
          <p className="text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p>
          <Link className={`${adminUi.btnPrimary} mt-4 inline-flex no-underline`} href="/admin/news-ticker/new">
            {t("newTicker")}
          </Link>
        </div>
      ) : null}

      {tickers.length > 0 ? (
        <div className={adminUi.tableWrap}>
          <table className={adminUi.table}>
            <thead>
              <tr>
                <th>{t("colName")}</th>
                <th>{t("colPlatform")}</th>
                <th>{t("colPage")}</th>
                <th>{t("colSource")}</th>
                <th>{t("colStatus")}</th>
                <th>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((tk) => (
                <tr key={tk.id}>
                  <td className="font-semibold">{tk.name}</td>
                  <td>{t(`platform_${tk.platform}` as "platform_both")}</td>
                  <td>
                    {t(`scope_${tk.pageScope}` as "scope_all")}
                    {tk.pageScope === "custom" && tk.pagePath ? (
                      <span className="ms-1 font-mono text-xs opacity-70">{tk.pagePath}</span>
                    ) : null}
                  </td>
                  <td>{t(`source_${tk.dataSource}` as "source_custom")}</td>
                  <td>
                    <span
                      className={
                        tk.enabled
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-[var(--admin-text-secondary)]"
                      }
                    >
                      {tk.enabled ? t("statusOn") : t("statusOff")}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className={adminUi.linkEmphasized} href={`/admin/news-ticker/${tk.id}`}>
                        {t("edit")}
                      </Link>
                      <form action={toggleNewsTicker}>
                        <input type="hidden" name="id" value={tk.id} />
                        <input type="hidden" name="enabled" value={tk.enabled ? "false" : "true"} />
                        <button type="submit" className={adminUi.btnSecondary}>
                          {tk.enabled ? t("disable") : t("enable")}
                        </button>
                      </form>
                      <form action={deleteNewsTicker}>
                        <input type="hidden" name="id" value={tk.id} />
                        <button type="submit" className={adminUi.btnDanger}>
                          {t("delete")}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
