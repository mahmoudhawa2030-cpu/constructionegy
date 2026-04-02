import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  AdminCreateHomepageItemForm,
  AdminDeleteHomepageItemInline,
  AdminDeleteHomepageSectionForm,
  AdminEditHomepageItemForm,
  AdminEditHomepageSectionForm,
} from "@/components/admin-homepage-forms";
import { adminUi } from "@/lib/admin-ui";
import { getCategoriesForListingForm } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ sectionId: string }> };

export default async function AdminHomepageSectionDetailPage({ params }: PageProps) {
  const { sectionId } = await params;
  if (!UUID_RE.test(sectionId)) {
    notFound();
  }

  const t = await getTranslations("adminHomepage");
  const supabase = await createClient();

  const { data: section, error } = await supabase.from("homepage_sections").select("*").eq("id", sectionId).maybeSingle();

  if (error || !section) {
    notFound();
  }

  const { data: items } = await supabase
    .from("homepage_section_items")
    .select("*")
    .eq("section_id", section.id)
    .order("sort_order", { ascending: true });

  const categoryExtraSlugs = (items ?? [])
    .map((i) => i.category_slug)
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  const categories = await getCategoriesForListingForm(categoryExtraSlugs);

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link className={adminUi.linkBack} href="/admin/homepage">
          {t("backList")}
        </Link>
      </div>

      <AdminEditHomepageSectionForm section={section} />

      <div className="mt-4">
        <AdminDeleteHomepageSectionForm sectionId={section.id} />
      </div>

      <h2 className={`${adminUi.sectionTitle} mt-10`}>{t("itemsTitle")}</h2>
      <p className={adminUi.sectionLead}>{t("itemsLead")}</p>

      <div className="mt-4 flex flex-col gap-4">
        {(items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 border-b border-[var(--admin-shell-border)] pb-4 lg:flex-row lg:items-start"
          >
            <div className="min-w-0 flex-1">
              <AdminEditHomepageItemForm categories={categories} item={item} />
            </div>
            <div className="shrink-0">
              <AdminDeleteHomepageItemInline itemId={item.id} />
            </div>
          </div>
        ))}
      </div>

      {(items ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">{t("emptyItems")}</p>
      ) : null}

      <AdminCreateHomepageItemForm categories={categories} sectionId={section.id} />
    </div>
  );
}
