import { getTranslations } from "next-intl/server";

import { AdminVeteransCornerTable } from "@/components/admin/admin-veterans-corner-table";
import { adminUi } from "@/lib/admin-ui";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VeteransCornerPostRow = {
  id: string;
  title: string;
  created_at: string;
  is_veterans_corner: boolean;
  user_id: string;
};

export default async function AdminVeteransCornerPage() {
  await requireAdmin();
  const t = await getTranslations("adminVeteransCorner");
  const supabase = await createClient();

  // Only posts by verified industry experts (“veterans”) — not the whole site feed.
  const { data: expertRows, error: expertsError } = await supabase
    .from("profiles")
    .select("id")
    .eq("expert_verification_status", "verified");

  const expertIds = [...new Set((expertRows ?? []).map((r) => r.id).filter(Boolean))];

  let posts: VeteransCornerPostRow[] | null = null;
  let postsError: (typeof expertsError) | null = null;

  if (!expertsError && expertIds.length === 0) {
    posts = [];
  } else if (!expertsError) {
    const res = await supabase
      .from("feed_posts")
      .select("id,title,created_at,is_veterans_corner,user_id")
      .eq("status", "published")
      .in("user_id", expertIds)
      .order("created_at", { ascending: false })
      .limit(100);
    postsError = res.error;
    posts = (res.data ?? []) as VeteransCornerPostRow[];
  }

  const userIds = posts?.length
    ? [...new Set(posts.map((p) => p.user_id).filter(Boolean))]
    : [];

  const { data: profiles, error: profilesError } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id,full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string | null }[], error: null };

  const error = expertsError ?? postsError ?? profilesError;

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
