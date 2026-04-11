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

  // Avoid PostgREST nested embed (`profiles(...)`) — it fails if the FK isn’t in the API schema
  // cache (common after migrations) and surfaces as a generic query error on Vercel.
  const { data: posts, error: postsError } = await supabase
    .from("feed_posts")
    .select("id,title,created_at,is_veterans_corner,user_id")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  const userIds = posts?.length
    ? [...new Set(posts.map((p) => p.user_id).filter(Boolean))]
    : [];

  const { data: profiles, error: profilesError } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null }[], error: null };

  const error = postsError ?? profilesError;

  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name?.trim() || ""]));

  const rows =
    !error && posts
      ? posts.map((row) => ({
          id: row.id,
          title: row.title,
          created_at: row.created_at,
          is_veterans_corner: row.is_veterans_corner,
          authorName: nameByUserId.get(row.user_id) || "—",
        }))
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
          {error.message ? (
            <span className="mt-1 block font-mono text-xs opacity-90">{error.message}</span>
          ) : null}
        </div>
      ) : (
        <AdminVeteransCornerTable rows={rows} />
      )}
    </div>
  );
}
