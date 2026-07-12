import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminWebHomepageEditor } from "@/components/admin-web-homepage-editor";
import { CatListingsSectionsPanel } from "@/components/admin/cat-listings-sections-panel";
import { adminUi } from "@/lib/admin-ui";
import { getActiveCategoriesForSelect } from "@/lib/categories/queries";
import {
  WEB_HOME_SECTION_SLUGS,
  getWebHomeData,
  getCategoryListingSections,
  type WebHomeSectionSlug,
} from "@/lib/homepage/web-home-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const t = await getTranslations("adminWebHomepage");
  const supabase = await createClient();

  // Fetch sections + items + picker data in parallel
  const [webHomeData, catListingSections, listingsRes, suppliersRes, categoryOptions] = await Promise.all([
    getWebHomeData(supabase),
    getCategoryListingSections(supabase),
    supabase
      .from("listings")
      .select("id, title, price")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("profiles")
      .select("id, full_name, legal_company_name")
      .eq("business_verification_status", "approved")
      .limit(200),
    getActiveCategoriesForSelect(),
  ]);

  const listingOptions = (listingsRes.data ?? []).map((l) => ({
    id: l.id,
    title: l.title,
    price: l.price,
  }));

  const supplierOptions = (suppliersRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.legal_company_name?.trim() || p.full_name || "Supplier",
  }));

  return (
    <div className={adminUi.page}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className={adminUi.btnSecondary + " px-3 py-1.5"} href="/web" target="_blank">
            {t("previewWebHome")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("backAdmin")}
          </Link>
        </div>
      </div>

      <div className={adminUi.messageStripInfo}>
        <p className="text-sm">{t("infoNote")}</p>
      </div>

      {/* Render one editor per known section */}
      <div className="grid gap-6">
        {WEB_HOME_SECTION_SLUGS.map((slug) => {
          const section = webHomeData[slug];
          if (!section) {
            return (
              <div
                key={slug}
                className="rounded-sm border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {t("missingSection", { slug })}
              </div>
            );
          }
          return (
            <AdminWebHomepageEditor
              key={slug}
              section={section}
              sectionSlug={slug as WebHomeSectionSlug}
              listingOptions={listingOptions}
              supplierOptions={supplierOptions}
              categoryOptions={categoryOptions}
            />
          );
        })}
      </div>

      {/* Category listing sections */}
      <CatListingsSectionsPanel
        sections={catListingSections.map((s) => ({
          id: s.id,
          slug: s.slug,
          categorySlug: s.categorySlug,
          title_ar: s.title_ar,
          title_en: s.title_en,
          subtitle_ar: s.subtitle_ar,
          subtitle_en: s.subtitle_en,
          sort_order: s.sort_order,
          enabled: s.enabled,
        }))}
        categoryOptions={categoryOptions}
      />

      {/* Legacy: link to old desktop categories tool */}
      <div className={`${adminUi.widget} mt-4`}>
        <div className={adminUi.widgetHeader}>{t("legacyTitle")}</div>
        <div className={`${adminUi.widgetBodyFlush} p-4`}>
          <p className="text-sm text-[var(--admin-text-secondary)]">{t("legacyLead")}</p>
          <Link
            className={`${adminUi.btnSecondary} mt-3 inline-block px-4 py-2 text-sm`}
            href="/admin/homepage/desktop-categories"
          >
            {t("legacyLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
