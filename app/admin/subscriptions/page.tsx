import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminSubscriptionEnforcementForm } from "@/components/admin-subscription-enforcement-form";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const t = await getTranslations("adminSubscriptionsPage");
  const supabase = await createClient();

  const { data: enforceRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "enforce_subscriptions")
    .maybeSingle();
  const enforcementOn = enforceRow?.value === "true";

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>{t("title")}</h1>
        <Link className={adminUi.linkBack} href="/admin">
          {t("back")}
        </Link>
      </div>

      <div className={`${adminUi.card} mb-6 space-y-4 p-5`}>
        <AdminSubscriptionEnforcementForm initialEnabled={enforcementOn} />
      </div>

      <div className={`${adminUi.card} space-y-3 p-5`}>
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("body")}</p>
        <p className="text-xs font-medium text-amber-900 dark:text-amber-200">{t("enforcementReminder")}</p>
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
