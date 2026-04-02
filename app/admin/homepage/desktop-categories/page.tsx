import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  AdminCreateDesktopCategoryCardForm,
  AdminDeleteDesktopCategoryCardForm,
  AdminEditDesktopCategoryCardForm,
} from "@/components/admin-desktop-category-cards-forms";
import { getAllCategoriesForAdmin } from "@/lib/categories/admin-queries";
import { adminUi } from "@/lib/admin-ui";
import { getSubscriptionServicesOrdered } from "@/lib/subscriptions/services-queries";
import { desktopCategoryIconPublicUrl } from "@/lib/supabase/desktop-category-icon-url";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DesktopCardRow = Database["public"]["Tables"]["homepage_desktop_category_cards"]["Row"];

export const dynamic = "force-dynamic";

export default async function AdminDesktopCategoryCardsPage() {
  const t = await getTranslations("adminHomepage.desktopCategories");
  const supabase = await createClient();

  const [{ data: cards, error }, categoryRows, subscriptionServices] = await Promise.all([
    supabase.from("homepage_desktop_category_cards").select("*").order("sort_order", { ascending: true }),
    getAllCategoriesForAdmin(),
    getSubscriptionServicesOrdered(),
  ]);

  const catBySlug = new Map(categoryRows.map((c) => [c.slug, c]));
  const serviceRowsAll = subscriptionServices.filter((s) => s.feature_key !== "all");
  const svcByKey = new Map(serviceRowsAll.map((s) => [s.feature_key, s]));

  const usedCategorySlugs = new Set(
    (cards ?? []).map((c) => c.category_slug).filter((s): s is string => Boolean(s)),
  );
  const usedFeatureKeys = new Set(
    (cards ?? []).map((c) => c.subscription_feature_key).filter((s): s is string => Boolean(s)),
  );

  const categoryOptions = categoryRows
    .filter((c) => c.is_active && !usedCategorySlugs.has(c.slug))
    .map((c) => ({ slug: c.slug, label_ar: c.label_ar }));

  const serviceOptions = serviceRowsAll
    .filter((s) => !usedFeatureKeys.has(s.feature_key))
    .map((s) => ({ feature_key: s.feature_key, label_ar: s.label_ar, label_en: s.label_en }));

  function labelForCard(card: DesktopCardRow): string {
    if (card.category_slug) {
      const cat = catBySlug.get(card.category_slug);
      return cat ? `${cat.label_ar} (${card.category_slug})` : card.category_slug;
    }
    if (card.subscription_feature_key) {
      const svc = svcByKey.get(card.subscription_feature_key);
      return svc ? `${svc.label_ar} (${card.subscription_feature_key})` : card.subscription_feature_key;
    }
    return "—";
  }

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link className={adminUi.linkBack} href="/admin/homepage">
          {t("back")}
        </Link>
      </div>

      <h1 className={adminUi.pageTitle}>{t("title")}</h1>
      <p className={adminUi.pageLead}>{t("lead")}</p>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p> : null}

      <AdminCreateDesktopCategoryCardForm categoryOptions={categoryOptions} serviceOptions={serviceOptions} />

      <h2 className={`${adminUi.sectionTitle} mt-10`}>{t("existingTitle")}</h2>
      <div className="mt-4 flex flex-col gap-4">
        {(cards ?? []).map((card) => (
          <div
            key={card.id}
            className="flex flex-col gap-2 border-b border-[var(--admin-shell-border)] pb-4 lg:flex-row lg:items-start"
          >
            <div className="min-w-0 flex-1">
              <AdminEditDesktopCategoryCardForm
                card={card}
                imagePublicUrl={desktopCategoryIconPublicUrl(card.image_storage_path)}
                targetLabel={labelForCard(card)}
              />
            </div>
            <div className="shrink-0">
              <AdminDeleteDesktopCategoryCardForm cardId={card.id} />
            </div>
          </div>
        ))}
      </div>

      {!(cards ?? []).length ? <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p> : null}
    </div>
  );
}
