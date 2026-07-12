import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MobileHomepageEditor } from "@/components/admin-mobile-homepage-editor";
import { adminUi } from "@/lib/admin-ui";
import { getMobileHomepageConfig } from "@/lib/homepage/actions";

export const dynamic = "force-dynamic";

export default async function AdminMobileHomepagePage() {
  const t = await getTranslations("adminMobileHomepage");
  const config = await getMobileHomepageConfig();

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className={`${adminUi.btnSecondary} px-3 py-1.5`} href="/" target="_blank">
            {t("previewMobileHome")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("backAdmin")}
          </Link>
        </div>
      </div>

      <div className={adminUi.messageStripInfo}>
        <p className="text-sm">{t("infoNote")}</p>
      </div>

      <MobileHomepageEditor initialConfig={config} />
    </div>
  );
}
