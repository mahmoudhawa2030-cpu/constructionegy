import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SeoSettingsForm } from "@/components/admin/seo-settings-form";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSeoSettings } from "@/lib/seo/site-settings";
import { getSiteUrl } from "@/lib/seo/site-url";

export default async function AdminSeoSettingsPage() {
  await requireAdmin();
  const t = await getTranslations("adminSeoSettings");
  const base = getSiteUrl();
  const settings = await getSiteSeoSettings(base);

  return (
    <div className={adminUi.page}>
      <div className="mb-6">
        <Link className={adminUi.linkBack} href="/admin">
          {t("back")}
        </Link>
        <h1 className={adminUi.pageTitle}>{t("pageTitle")}</h1>
        <p className={adminUi.pageLead}>{t("lead")}</p>
      </div>

      <SeoSettingsForm baseUrl={base} settings={settings} />
    </div>
  );
}
