"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/lib/auth/admin";
import { SUBSCRIPTION_FEATURES } from "@/lib/subscriptions/features";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubscriptionActionState = { ok: true; message?: string } | { ok: false; message: string };

function revalidateAll(userId: string) {
  revalidatePath("/admin/subscriptions");
  revalidatePath(`/admin/users/${userId}/subscriptions`);
}

export async function createSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const userId = String(formData.get("user_id") ?? "").trim();
  const feature = String(formData.get("feature") ?? "").trim();
  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!UUID_RE.test(userId)) {
    return { ok: false, message: "معرّف المستخدم غير صالح." };
  }
  if (!SUBSCRIPTION_FEATURES.includes(feature as never)) {
    return { ok: false, message: "الميزة غير صالحة." };
  }

  const validUntil = validUntilRaw
    ? new Date(validUntilRaw).toISOString()
    : null;

  if (validUntilRaw && isNaN(new Date(validUntilRaw).getTime())) {
    return { ok: false, message: "تاريخ الانتهاء غير صالح." };
  }

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    feature: feature as "rfq" | "live_map" | "premium_listings" | "all",
    valid_until: validUntil,
    notes,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateAll(userId);
  return { ok: true, message: "تم إضافة الاشتراك." };
}

export async function deleteSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  await requireAdmin();
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

  revalidateAll(userId);
  return { ok: true, message: "تم حذف الاشتراك." };
}

export async function updateSubscriptionFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!UUID_RE.test(id)) {
    return { ok: false, message: "معرّف غير صالح." };
  }

  const validUntil = validUntilRaw
    ? new Date(validUntilRaw).toISOString()
    : null;

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

  revalidateAll(userId);
  return { ok: true, message: "تم تحديث الاشتراك." };
}

/** One source of truth with Postgres RLS (`app_settings.enforce_subscriptions`). */
export async function setSubscriptionEnforcementFromForm(
  _prev: SubscriptionActionState | null,
  formData: FormData,
): Promise<SubscriptionActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const enabled =
    formData.get("enforce_subscriptions") === "on" ||
    formData.get("enforce_subscriptions") === "true";

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
  const t = await getTranslations("adminSubscriptions.enforcement");
  return {
    ok: true,
    message: enabled ? t("savedOn") : t("savedOff"),
  };
}
