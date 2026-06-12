import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { adminUi } from "@/lib/admin-ui";
import { getTrackingScripts } from "@/lib/tracking/get-tracking-scripts";

import { TrackingForm } from "./tracking-form";

export default async function AdminTrackingPage() {
  const t = await getTranslations("adminTracking");
  const scripts = await getTrackingScripts();

  return (
    <div className={adminUi.page}>
      <div className="mb-6">
        <Link className={adminUi.linkBack} href="/admin">
          {t("backAdmin")}
        </Link>
        <h1 className={adminUi.pageTitle}>{t("pageTitle")}</h1>
        <p className={adminUi.pageLead}>{t("lead")}</p>
      </div>

      <div className={adminUi.cardPadded}>
        <TrackingForm initialFooter={scripts.footer} initialHeader={scripts.header} />
      </div>
    </div>
  );
}
