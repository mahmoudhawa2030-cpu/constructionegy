import { getTranslations } from "next-intl/server";

import { AdminVeteransCornerTable } from "@/components/admin/admin-veterans-corner-table";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminVeteransCornerPage() {
  await requireAdmin();
  const t = await getTranslations("adminVeteransCorner");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feed_posts")
    .select(
      `
      id,
      title,
      created_at,
      is_veterans_corner,
      user_id,
      profiles ( full_name )
    `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows =
    !error && data
      ? data.map((row) => {
          const prof = row.profiles as { full_name: string | null } | null;
          return {
            id: row.id,
            title: row.title,
            created_at: row.created_at,
            is_veterans_corner: row.is_veterans_corner,
            authorName: prof?.full_name?.trim() || "—",
          };
        })
      : [];

  return (
    <div className={adminUi.page}>
      <div>
        <h1 className={adminUi.pageTitle}>{t("pageTitle")}</h1>
        <p className={adminUi.pageLead}>{t("lead")}</p>
      </div>

      {error ? (
        <div className={adminUi.messageStripWarn} role="alert">
          {t("loadError")}
        </div>
      ) : (
        <AdminVeteransCornerTable rows={rows} />
      )}
    </div>
  );
}
