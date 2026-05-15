import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NotifRow = {
  id: string;
  type: "comment_on_post" | "reply_to_comment";
  actor_name: string;
  post_id: string;
  read: boolean;
  created_at: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const t = await getTranslations("commentNotifications");

  const { data: rows } = await (supabase
    .from("comment_notifications" as never)
    .select("id,type,actor_name,post_id,read,created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50) as unknown as Promise<{ data: NotifRow[] | null }>);

  const notifs = rows ?? [];

  const unreadIds = notifs.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await (supabase
      .from("comment_notifications" as never)
      .update({ read: true } as never)
      .in("id", unreadIds) as unknown as Promise<unknown>);
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="font-bina-display text-lg font-bold text-[var(--bina-text)]">
        {t("panelTitle")}
      </h1>
      {notifs.length === 0 ? (
        <p className="font-bina-display text-sm text-[var(--bina-muted)]">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifs.map((n) => (
            <li key={n.id}>
              <Link
                href={`/posts/${n.post_id}#comments`}
                className={`block rounded-[var(--bina-r)] border px-4 py-3 transition-colors ${
                  n.read
                    ? "border-[var(--bina-border)] bg-[var(--bina-steel2)]"
                    : "border-[var(--bina-or)] bg-[var(--bina-steel2)]"
                }`}
              >
                <p className="font-bina-display text-sm text-[var(--bina-text)]">
                  {n.type === "reply_to_comment"
                    ? t("replyToComment", { actor: n.actor_name })
                    : t("commentOnPost", { actor: n.actor_name })}
                </p>
                <p className="font-bina-display mt-1 text-[10px] text-[var(--bina-muted)]">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
