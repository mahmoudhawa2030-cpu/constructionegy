import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { DeletePostButton } from "@/components/admin/delete-post-button";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminBlogListPage() {
  const supabase = await createClient();
  const t = await getTranslations("adminBlog");

  const { data: posts } = await supabase
    .from("seo_posts")
    .select("id, title, category_slug, slug, status, seo_score, publish_at, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Link className={adminUi.btnPrimary} href="/admin/blog/new">
            {t("newPost")}
          </Link>
          <Link className={adminUi.linkBack} href="/admin">
            {t("back")}
          </Link>
        </div>
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("allPosts")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={`${adminUi.table} min-w-[44rem]`}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colTitle")}</th>
                  <th className={adminUi.th}>{t("colCategory")}</th>
                  <th className={adminUi.th}>{t("colStatus")}</th>
                  <th className={adminUi.th}>{t("colScore")}</th>
                  <th className={adminUi.th}>{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {(posts ?? []).map((p) => (
                  <tr key={p.id} className={`${adminUi.tbodyRow} align-middle`}>
                    <td className={adminUi.td}>
                      <Link className={adminUi.linkEmphasized} href={`/admin/blog/${p.id}`}>
                        {p.title}
                      </Link>
                      <div className={adminUi.footnote}>
                        /{p.category_slug}/{p.slug}
                      </div>
                    </td>
                    <td className={`${adminUi.td} whitespace-nowrap`}>{p.category_slug}</td>
                    <td className={`${adminUi.td} whitespace-nowrap`}>
                      {p.status === "published" ? (
                        <span className="rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                          {t("statusPublished")}
                        </span>
                      ) : (
                        <span className="rounded-sm bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {p.publish_at ? t("statusScheduled") : t("statusDraft")}
                        </span>
                      )}
                    </td>
                    <td className={`${adminUi.td} whitespace-nowrap text-center tabular-nums`}>
                      {p.seo_score}
                    </td>
                    <td className={adminUi.td}>
                      <div className="flex flex-nowrap items-center gap-2">
                        <Link className={adminUi.btnGhost} href={`/admin/blog/${p.id}`}>
                          {t("edit")}
                        </Link>
                        {p.status === "published" ? (
                          <Link
                            className={adminUi.btnGhost}
                            href={`/${p.category_slug}/${p.slug}`}
                            target="_blank"
                          >
                            {t("view")}
                          </Link>
                        ) : null}
                        <DeletePostButton id={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(posts ?? []).length === 0 ? (
        <p className="text-sm text-[var(--admin-text-secondary)]">{t("empty")}</p>
      ) : null}
    </div>
  );
}
