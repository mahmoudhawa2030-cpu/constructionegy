import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  AdminCreateDesktopCategoryCardForm,
  AdminDeleteDesktopCategoryCardForm,
  AdminEditDesktopCategoryCardForm,
} from "@/components/admin-desktop-category-cards-forms";
import { getAllCategoriesForAdmin } from "@/lib/categories/admin-queries";
import { adminUi } from "@/lib/admin-ui";
import { desktopCategoryIconPublicUrl } from "@/lib/supabase/desktop-category-icon-url";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDesktopCategoryCardsPage() {
  const t = await getTranslations("adminHomepage.desktopCategories");
  const supabase = await createClient();

  const { data: cards, error } = await supabase
    .from("homepage_desktop_category_cards")
    .select("*")
    .order("sort_order", { ascending: true });

  const categoryRows = await getAllCategoriesForAdmin();
  const catBySlug = new Map(categoryRows.map((c) => [c.slug, c]));

  const usedSlugs = new Set((cards ?? []).map((c) => c.category_slug));
  const availableOptions = categoryRows
    .filter((c) => c.is_active && !usedSlugs.has(c.slug))
    .map((c) => ({ slug: c.slug, label_ar: c.label_ar }));

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

      <AdminCreateDesktopCategoryCardForm options={availableOptions} />

      <h2 className={`${adminUi.sectionTitle} mt-10`}>{t("existingTitle")}</h2>
      <div className="mt-4 flex flex-col gap-4">
        {(cards ?? []).map((card) => {
          const cat = catBySlug.get(card.category_slug);
          const label = cat ? `${cat.label_ar} (${card.category_slug})` : card.category_slug;
          return (
            <div
              key={card.id}
              className="flex flex-col gap-2 border-b border-[var(--admin-shell-border)] pb-4 lg:flex-row lg:items-start"
            >
              <div className="min-w-0 flex-1">
                <AdminEditDesktopCategoryCardForm
                  card={card}
                  categoryLabel={label}
                  imagePublicUrl={desktopCategoryIconPublicUrl(card.image_storage_path)}
                />
              </div>
              <div className="shrink-0">
                <AdminDeleteDesktopCategoryCardForm cardId={card.id} />
              </div>
            </div>
          );
        })}
      </div>

      {!(cards ?? []).length ? <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p> : null}
    </div>
  );
}
