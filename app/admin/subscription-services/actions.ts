"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const keySchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, "المعرّف يجب أن يبدأ بحرف إنجليزي صغير ثم أحرف صغيرة وأرقام و _ فقط.");

export type SubscriptionServiceActionState =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export async function createSubscriptionServiceFromForm(
  _prev: SubscriptionServiceActionState | null,
  formData: FormData,
): Promise<SubscriptionServiceActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const rawKey = String(formData.get("feature_key") ?? "").trim();
  const parsedKey = keySchema.safeParse(rawKey);
  if (!parsedKey.success) {
    return { ok: false, message: parsedKey.error.issues[0]?.message ?? "معرّف غير صالح" };
  }

  const label_ar = String(formData.get("label_ar") ?? "").trim();
  const label_en = String(formData.get("label_en") ?? "").trim();
  if (label_ar.length < 1 || label_ar.length > 200) {
    return { ok: false, message: "التسمية بالعربية مطلوبة (حتى 200 حرف)." };
  }
  if (label_en.length < 1 || label_en.length > 200) {
    return { ok: false, message: "التسمية بالإنجليزية مطلوبة (حتى 200 حرف)." };
  }

  let sortNum = Number.parseInt(String(formData.get("sort_order") ?? "100"), 10);
  if (Number.isNaN(sortNum)) sortNum = 100;

  const requires_subscription = formData.get("requires_subscription") === "on";

  const { error } = await supabase.from("subscription_services").insert({
    feature_key: parsedKey.data,
    label_ar,
    label_en,
    sort_order: sortNum,
    requires_subscription,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "هذا المعرّف مستخدم بالفعل." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/subscription-services");
  return { ok: true, message: "تمت إضافة الخدمة. لاستخدامها في الواجهة أضف التحقق المناسب في الكود إن لزم." };
}

export async function updateSubscriptionServiceFromForm(
  _prev: SubscriptionServiceActionState | null,
  formData: FormData,
): Promise<SubscriptionServiceActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const feature_key = String(formData.get("feature_key") ?? "").trim();
  if (!keySchema.safeParse(feature_key).success) {
    return { ok: false, message: "معرّف غير صالح." };
  }

  const label_ar = String(formData.get("label_ar") ?? "").trim();
  const label_en = String(formData.get("label_en") ?? "").trim();
  if (label_ar.length < 1 || label_ar.length > 200) {
    return { ok: false, message: "التسمية بالعربية مطلوبة." };
  }
  if (label_en.length < 1 || label_en.length > 200) {
    return { ok: false, message: "التسمية بالإنجليزية مطلوبة." };
  }

  let sortNum = Number.parseInt(String(formData.get("sort_order") ?? "0"), 10);
  if (Number.isNaN(sortNum)) sortNum = 0;

  const requires_subscription = formData.get("requires_subscription") === "on";

  const { error } = await supabase
    .from("subscription_services")
    .update({
      label_ar,
      label_en,
      sort_order: sortNum,
      requires_subscription,
    })
    .eq("feature_key", feature_key);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/subscription-services");
  return { ok: true, message: "تم حفظ الخدمة." };
}
