import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminUserEditForm } from "@/components/admin-user-edit-form";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">تعديل مستخدم</h1>
        <Link
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          href="/admin/users"
        >
          العودة لقائمة المستخدمين
        </Link>
      </div>

      {isOtherAdmin ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          لا يمكن تعديل بيانات إداري آخر من لوحة التحكم.
        </div>
      ) : (
        <AdminUserEditForm profile={profile} />
      )}
    </div>
  );
}
