"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/admin";
import type { UpdateProfileState } from "@/lib/profile/actions";
import { updateProfileSchema } from "@/lib/profile/schema";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AdminUserActionState = { ok: true; message?: string } | { ok: false; message: string };

async function getAdminActor() {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile?.is_admin) {
    return null;
  }
  return { user, profile };
}

export async function banUserFromForm(
  _prev: AdminUserActionState | null,
  formData: FormData,
): Promise<AdminUserActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const raw = formData.get("user_id");
  const userId = typeof raw === "string" ? raw.trim() : "";
  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف غير صالح." };
  }
  if (userId === actor.user.id) {
    return { ok: false, message: "لا يمكنك حظر حسابك." };
  }

  const supabase = await createClient();
  const { data: target, error: fetchErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { ok: false, message: fetchErr?.message ?? "المستخدم غير موجود." };
  }
  if (target.is_admin) {
    return { ok: false, message: "لا يمكن حظر حساب إداري." };
  }

  const { error } = await supabase.from("profiles").update({ is_banned: true }).eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "تم حظر الحساب." };
}

export async function unbanUserFromForm(
  _prev: AdminUserActionState | null,
  formData: FormData,
): Promise<AdminUserActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const raw = formData.get("user_id");
  const userId = typeof raw === "string" ? raw.trim() : "";
  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف غير صالح." };
  }
  if (userId === actor.user.id) {
    return { ok: false, message: "لا يمكنك إلغاء حظر حسابك بهذه الطريقة." };
  }

  const supabase = await createClient();
  const { data: target, error: fetchErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { ok: false, message: fetchErr?.message ?? "المستخدم غير موجود." };
  }
  if (target.is_admin) {
    return { ok: false, message: "لا يمكن تعديل حالة إداري بهذه الطريقة." };
  }

  const { error } = await supabase.from("profiles").update({ is_banned: false }).eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "تم إلغاء الحظر." };
}

export async function deleteUserFromForm(
  _prev: AdminUserActionState | null,
  formData: FormData,
): Promise<AdminUserActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const raw = formData.get("user_id");
  const userId = typeof raw === "string" ? raw.trim() : "";
  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف غير صالح." };
  }
  if (userId === actor.user.id) {
    return { ok: false, message: "لا يمكنك حذف حسابك." };
  }

  const supabase = await createClient();
  const { data: target, error: fetchErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { ok: false, message: fetchErr?.message ?? "المستخدم غير موجود." };
  }
  if (target.is_admin) {
    return { ok: false, message: "لا يمكن حذف حساب إداري." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return {
      ok: false,
      message:
        "حذف الحساب يتطلب مفتاح الخادم. أضف SUPABASE_SERVICE_ROLE_KEY إلى ملف .env.local (من لوحة Supabase → Settings → API).",
    };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: "تم حذف الحساب نهائياً." };
}

export async function updateAdminUserProfile(
  _prev: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const rawId = formData.get("user_id");
  const userId = typeof rawId === "string" ? rawId.trim() : "";
  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف المستخدم غير صالح." };
  }

  const s = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };

  const raw = {
    full_name: s("full_name"),
    user_type: s("user_type"),
    phone_number: s("phone_number"),
    whatsapp_number: s("whatsapp_number"),
    location: s("location"),
    avatar_url: s("avatar_url"),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: first?.message ?? "بيانات غير صالحة",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: target, error: fetchErr } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr || !target) {
    return { ok: false, message: fetchErr?.message ?? "المستخدم غير موجود." };
  }

  const isSelf = userId === actor.user.id;
  if (target.is_admin && !isSelf) {
    return { ok: false, message: "لا يمكن تعديل بيانات إداري آخر." };
  }

  const body = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: body.full_name,
      user_type: body.user_type,
      phone_number: body.phone_number,
      whatsapp_number: body.whatsapp_number,
      location: body.location,
      avatar_url: body.avatar_url,
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  revalidatePath(`/profile/${userId}`);
  if (isSelf) {
    revalidatePath("/profile");
  }
  return { ok: true, message: "تم حفظ بيانات المستخدم." };
}
