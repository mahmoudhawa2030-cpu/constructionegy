"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { getCurrentProfile } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubscriptionActionState = { ok: true; message?: string } | { ok: false; message: string };

export type SubscriptionEnforcementActionState = SubscriptionActionState;

async function getAdminActor() {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile?.is_admin) {
    return null;
  }
  return { user, profile };
}

function revalidateSubscriptionPaths(userId: string) {
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/subscription-services");
  revalidatePath(`/admin/users/${userId}/subscriptions`);
}

export async function setSubscriptionEnforcementFromForm(
  _prev: SubscriptionEnforcementActionState | null,
  formData: FormData,
): Promise<SubscriptionEnforcementActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const supabase = await createClient();
  const enabled =
    formData.get("enforce_subscriptions") === "on" || formData.get("enforce_subscriptions") === "true";

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: "enforce_subscriptions",
      value: enabled ? "true" : "false",
    },
    { onConflict: "key" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/subscription-services");
  const t = await getTranslations("adminSubscriptions.enforcement");
  return {
    ok: true,
    message: enabled ? t("savedOn") : t("savedOff"),
  };
}

export async function createSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const supabase = await createClient();

  const userId = String(formData.get("user_id") ?? "").trim();
  const feature = String(formData.get("feature") ?? "").trim();
  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف المستخدم غير صالح." };
  }

  const { data: svc } = await supabase
    .from("subscription_services")
    .select("feature_key")
    .eq("feature_key", feature)
    .maybeSingle();

  if (!svc) {
    return { ok: false, message: "الميزة غير معرّفة. أضفها في «خدمات الاشتراك» أو اختر مفتاحاً من القائمة." };
  }

  const validUntil = validUntilRaw ? new Date(validUntilRaw).toISOString() : null;

  if (validUntilRaw && isNaN(new Date(validUntilRaw).getTime())) {
    return { ok: false, message: "تاريخ الانتهاء غير صالح." };
  }

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    feature,
    valid_until: validUntil,
    notes,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateSubscriptionPaths(userId);
  return { ok: true, message: "تم إضافة الاشتراك." };
}

export async function deleteSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();

  if (!UUID_RE.test(id)) {
    return { ok: false, message: "معرّف غير صالح." };
  }

  const { error } = await supabase.from("subscriptions").delete().eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateSubscriptionPaths(userId);
  return { ok: true, message: "تم حذف الاشتراك." };
}

export async function updateSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  const actor = await getAdminActor();
  if (!actor) {
    return { ok: false, message: "غير مصرّح." };
  }

  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!UUID_RE.test(id)) {
    return { ok: false, message: "معرّف غير صالح." };
  }

  const validUntil = validUntilRaw ? new Date(validUntilRaw).toISOString() : null;

  if (validUntilRaw && isNaN(new Date(validUntilRaw).getTime())) {
    return { ok: false, message: "تاريخ الانتهاء غير صالح." };
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ valid_until: validUntil, notes })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateSubscriptionPaths(userId);
  return { ok: true, message: "تم تحديث الاشتراك." };
}
