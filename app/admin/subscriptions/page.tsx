import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { adminUi } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations("adminSubscriptionsPage");

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>{t("title")}</h1>
        <Link className={adminUi.linkBack} href="/admin">
          {t("back")}
        </Link>
      </div>
      <div className={`${adminUi.card} space-y-3 p-5`}>
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("body")}</p>
        <ul className="list-inside list-disc text-sm text-[var(--admin-text)]">
          <li>
            <Link className="underline" href="/admin/users">
              {t("usersLink")}
            </Link>
          </li>
          <li>
            <Link className="underline" href="/admin/subscription-services">
              {t("servicesLink")}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
