import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  CreateSubscriptionServiceForm,
  EditSubscriptionServiceForm,
} from "@/components/admin-subscription-services-forms";
import { adminUi } from "@/lib/admin-ui";
import { isSubscriptionEnforcementOn } from "@/lib/subscriptions/can-access";
import { getSubscriptionServicesOrdered } from "@/lib/subscriptions/services-queries";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionServicesPage() {
  const rows = await getSubscriptionServicesOrdered();
  const t = await getTranslations("adminSubscriptionServices");
  const enforcementOn = await isSubscriptionEnforcementOn();

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>{t("pageTitle")}</h1>
        <div className="flex flex-wrap gap-2">
          <Link className={adminUi.linkBack} href="/admin/subscriptions">
            {t("subscriptionsHubLink")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("backOverview")}
          </Link>
        </div>
      </div>

      {!enforcementOn ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <p className="font-semibold">{t("enforcementOffTitle")}</p>
          <p className="mt-1">{t("enforcementOffBody")}</p>
          <p className="mt-2">
            <Link className="font-medium text-amber-900 underline hover:no-underline dark:text-amber-200" href="/admin/subscriptions">
              {t("enforcementOffCta")}
            </Link>
          </p>
        </div>
      ) : null}

      <p className="text-sm text-[var(--admin-text-secondary)]">{t("intro")}</p>

      <CreateSubscriptionServiceForm />

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("listTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={`${adminUi.table} min-w-[42rem]`}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colKey")}</th>
                  <th className={adminUi.th}>{t("colLabels")}</th>
                  <th className={adminUi.th}>{t("colSort")}</th>
                  <th className={adminUi.th}>{t("colPaid")}</th>
                  <th className={adminUi.th}>{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature_key} className={adminUi.tbodyRow}>
                    <td className={`${adminUi.td} font-mono text-xs`} dir="ltr">
                      {row.feature_key}
                    </td>
                    <td className={`${adminUi.td} text-xs`}>
                      <div>{row.label_ar}</div>
                      <div className="text-[var(--admin-text-secondary)]" dir="ltr">
                        {row.label_en}
                      </div>
                    </td>
                    <td className={`${adminUi.td} tabular-nums`}>{row.sort_order}</td>
                    <td className={adminUi.td}>
                      {row.requires_subscription ? (
                        <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                          {t("badgePaid")}
                        </span>
                      ) : (
                        <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
                          {t("badgeFree")}
                        </span>
                      )}
                    </td>
                    <td className={adminUi.td}>
                      <EditSubscriptionServiceForm row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("emptyHint")}</p>
      ) : null}
    </div>
  );
}
