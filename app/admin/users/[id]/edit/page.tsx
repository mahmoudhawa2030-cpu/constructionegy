import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminUserEditForm } from "@/components/admin-user-edit-form";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminUserEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, user_type, phone_number, whatsapp_number, location, avatar_url, is_admin")
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const isSelf = currentUser?.id === profile.id;
  const isOtherAdmin = profile.is_admin && !isSelf;

  const service = createServiceRoleClient();
  let userEmail: string | null = null;
  let emailLoadIssue: "service_role" | "fetch_failed" | null = null;

  if (!service) {
    emailLoadIssue = "service_role";
  } else {
    const { data: authData, error: authErr } = await service.auth.admin.getUserById(id);
    if (authErr) {
      emailLoadIssue = "fetch_failed";
    } else {
      userEmail = authData.user?.email ?? null;
    }
  }

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className={adminUi.pageTitle}>تعديل مستخدم</h1>
        <div className="flex flex-wrap gap-2">
          <Link className={adminUi.linkBack} href={`/admin/users/${id}/subscriptions`}>
            الاشتراكات
          </Link>
          <Link className={adminUi.linkBack} href="/admin/users">
            العودة لقائمة المستخدمين
          </Link>
        </div>
      </div>

      {isOtherAdmin ? (
        <div className={adminUi.messageStripWarn}>لا يمكن تعديل بيانات إداري آخر من لوحة التحكم.</div>
      ) : (
        <AdminUserEditForm email={userEmail} emailLoadIssue={emailLoadIssue} profile={profile} />
      )}
    </div>
  );
}
