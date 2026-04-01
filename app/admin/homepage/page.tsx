import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  AdminCreateHomepageSectionForm,
  AdminDeleteHomepageSectionForm,
} from "@/components/admin-homepage-forms";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminHomepageListPage() {
  const t = await getTranslations("adminHomepage");
  const supabase = await createClient();

  const { data: sections, error } = await supabase
    .from("homepage_sections")
    .select("id, slug, section_type, sort_order, enabled, title_ar, title_en")
    .order("sort_order", { ascending: true });

  const sectionIds = sections?.map((s) => s.id) ?? [];
  const counts = new Map<string, number>();
  if (sectionIds.length > 0) {
    const { data: items } = await supabase
      .from("homepage_section_items")
      .select("section_id")
      .in("section_id", sectionIds);
    for (const row of items ?? []) {
      counts.set(row.section_id, (counts.get(row.section_id) ?? 0) + 1);
    }
  }

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <Link className={adminUi.linkBack} href="/admin">
          {t("backAdmin")}
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
      ) : null}

      <div className={adminUi.messageStripInfo}>
        <p className="text-sm">{t("mobileNote")}</p>
      </div>

      <AdminCreateHomepageSectionForm />

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("sectionsTableTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={adminUi.table}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colOrder")}</th>
                  <th className={adminUi.th}>{t("colSlug")}</th>
                  <th className={adminUi.th}>{t("colType")}</th>
                  <th className={adminUi.th}>{t("colTitles")}</th>
                  <th className={adminUi.th}>{t("colItems")}</th>
                  <th className={adminUi.th}>{t("colEnabled")}</th>
                  <th className={adminUi.th}>{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(sections ?? []).map((s) => (
                  <tr key={s.id} className={adminUi.tbodyRow}>
                    <td className={`${adminUi.td} tabular-nums`}>{s.sort_order}</td>
                    <td className={adminUi.td}>
                      <code className={adminUi.code}>{s.slug}</code>
                    </td>
                    <td className={adminUi.td}>{s.section_type === "carousel" ? t("typeCarousel") : t("typeGrid")}</td>
                    <td className={`${adminUi.tdMuted} max-w-[12rem] truncate`}>
                      {s.title_ar || "—"} / {s.title_en || "—"}
                    </td>
                    <td className={`${adminUi.td} tabular-nums`}>{counts.get(s.id) ?? 0}</td>
                    <td className={adminUi.td}>{s.enabled ? t("yes") : t("no")}</td>
                    <td className={adminUi.td}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link className={adminUi.btnToolbar} href={`/admin/homepage/${s.id}`}>
                          {t("edit")}
                        </Link>
                        <AdminDeleteHomepageSectionForm sectionId={s.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {!sections?.length ? <p className="text-sm text-[var(--admin-text-secondary)]">{t("emptySections")}</p> : null}
    </div>
  );
}
