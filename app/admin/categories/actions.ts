"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*$/, "المعرف يجب أن يبدأ بحرف إنجليزي ويحتوي أحرفاً صغيرة وأرقاماً و _ فقط.");

export type CategoryActionState = { ok: true; message?: string } | { ok: false; message: string };

export async function createCategoryFromForm(
  _prev: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const raw = {
    slug: String(formData.get("slug") ?? ""),
    label_ar: String(formData.get("label_ar") ?? "").trim(),
    sort_order: String(formData.get("sort_order") ?? "0"),
    is_active: formData.get("is_active") === "on",
  };

  const slugParsed = slugSchema.safeParse(raw.slug);
  if (!slugParsed.success) {
    return { ok: false, message: slugParsed.error.issues[0]?.message ?? "معرف غير صالح" };
  }
  if (raw.label_ar.length < 1 || raw.label_ar.length > 200) {
    return { ok: false, message: "اسم التصنيف بالعربية مطلوب (حتى 200 حرف)." };
  }

  let sortNum = Number.parseInt(raw.sort_order, 10);
  if (Number.isNaN(sortNum)) sortNum = 0;

  const { error } = await supabase.from("categories").insert({
    slug: slugParsed.data,
    label_ar: raw.label_ar,
    sort_order: sortNum,
    is_active: raw.is_active,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "هذا المعرف مستخدم بالفعل." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/gallery");
  revalidatePath("/listings/new");
  return { ok: true, message: "تم إضافة التصنيف." };
}

export async function updateCategoryFromForm(
  _prev: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, message: "معرف غير صالح." };
  }

  const raw = {
    slug: String(formData.get("slug") ?? ""),
    label_ar: String(formData.get("label_ar") ?? "").trim(),
    sort_order: String(formData.get("sort_order") ?? "0"),
    is_active: formData.get("is_active") === "on",
  };

  const slugParsed = slugSchema.safeParse(raw.slug);
  if (!slugParsed.success) {
    return { ok: false, message: slugParsed.error.issues[0]?.message ?? "معرف غير صالح" };
  }
  if (raw.label_ar.length < 1 || raw.label_ar.length > 200) {
    return { ok: false, message: "اسم التصنيف مطلوب." };
  }

  let sortNum = Number.parseInt(raw.sort_order, 10);
  if (Number.isNaN(sortNum)) sortNum = 0;

  const { error } = await supabase
    .from("categories")
    .update({
      slug: slugParsed.data,
      label_ar: raw.label_ar,
      sort_order: sortNum,
      is_active: raw.is_active,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "هذا المعرف مستخدم بالفعل." };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/gallery");
  revalidatePath("/listings/new");
  return { ok: true, message: "تم حفظ التصنيف." };
}

export async function deleteCategoryFromForm(
  _prev: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, message: "معرف غير صالح." };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        message: "لا يمكن الحذف: يوجد إعلانات تستخدم هذا التصنيف.",
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/gallery");
  return { ok: true, message: "تم حذف التصنيف." };
}
