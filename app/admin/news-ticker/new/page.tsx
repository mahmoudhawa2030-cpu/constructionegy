import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { NewsTickerForm } from "@/components/admin/news-ticker-form";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminNewsTickerNewPage() {
  await requireAdmin();
  const t = await getTranslations("adminNewsTicker");

  return (
    <div className={adminUi.page}>
      <div className="mb-4">
        <Link className={adminUi.linkBack} href="/admin/news-ticker">
          {t("backList")}
        </Link>
        <h1 className={adminUi.pageTitle}>{t("newTitle")}</h1>
        <p className={adminUi.pageLead}>{t("newLead")}</p>
      </div>
      <NewsTickerForm mode="create" />
    </div>
  );
}
