"use server";

import { revalidatePath } from "next/cache";

import { categorySlugExists } from "@/lib/categories/queries";
import { createListingSchema, updateListingSchema } from "@/lib/listings/schema";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function isAllowedPublicImageUrl(url: string, supabaseOrigin: string): boolean {
  try {
    const u = new URL(url);
    const base = new URL(supabaseOrigin);
    if (u.origin !== base.origin) return false;
    return u.pathname.includes("/storage/v1/object/public/listing-images/");
  } catch {
    return false;
  }
}

export type CreateListingResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function createListing(input: unknown): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "بيانات غير صالحة" };
  }

  const { url: supabaseUrl } = getSupabasePublicEnv();
  const body = parsed.data;
  for (const imageUrl of body.images) {
    if (!isAllowedPublicImageUrl(imageUrl, supabaseUrl)) {
      return { ok: false, message: "رابط صورة غير مسموح." };
    }
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title: body.title,
      category: body.category,
      type: body.type,
      condition: body.condition,
      price: body.price,
      price_unit: body.price_unit,
      description: body.description,
      location: body.location,
      images: body.images,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath(`/users/${user.id}/ads`);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/categories");

  return { ok: true, id: data.id };
}

export async function updateListing(
  listingId: string,
  input: unknown,
): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, message: "الإعلان غير موجود." };
  }
  if (existing.user_id !== user.id) {
    return { ok: false, message: "لا يمكنك تعديل هذا الإعلان." };
  }

  const parsed = updateListingSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "بيانات غير صالحة" };
  }

  const body = parsed.data;
  const exists = await categorySlugExists(body.category);
  if (!exists) {
    return { ok: false, message: "التصنيف غير موجود." };
  }

  const { url: supabaseUrl } = getSupabasePublicEnv();
  for (const imageUrl of body.images) {
    if (!isAllowedPublicImageUrl(imageUrl, supabaseUrl)) {
      return { ok: false, message: "رابط صورة غير مسموح." };
    }
  }

  const { error } = await supabase
    .from("listings")
    .update({
      title: body.title,
      category: body.category,
      type: body.type,
      condition: body.condition,
      price: body.price,
      price_unit: body.price_unit,
      description: body.description,
      location: body.location,
      images: body.images,
    })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/gallery");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath("/");
  revalidatePath(`/users/${user.id}/ads`);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/categories");

  return { ok: true, id: listingId };
}

function revalidateListingPaths(params: { listingId: string; ownerId: string }) {
  const { listingId, ownerId } = params;
  revalidatePath("/gallery");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/edit`);
  revalidatePath("/");
  revalidatePath(`/users/${ownerId}/ads`);
  revalidatePath("/profile");
  revalidatePath(`/profile/${ownerId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
}

/** Hide from public (gallery) but keep for owner on `/` (and `/users/…/ads` for others). Only for published (active) ads. */
export async function pauseListing(listingId: string): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: "الإعلان غير موجود." };
  }
  if (row.user_id !== user.id) {
    return { ok: false, message: "لا يمكنك تعديل هذا الإعلان." };
  }
  if (row.status !== "active") {
    return {
      ok: false,
      message: "الإيقاف المؤقت متاح للإعلانات المعتمدة (المنشورة) فقط.",
    };
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "paused" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      message: friendlyListingActionError(error.message),
    };
  }

  revalidateListingPaths({ listingId, ownerId: user.id });
  return { ok: true, id: listingId };
}

export async function resumeListing(listingId: string): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: "الإعلان غير موجود." };
  }
  if (row.user_id !== user.id) {
    return { ok: false, message: "لا يمكنك تعديل هذا الإعلان." };
  }
  if (row.status !== "paused") {
    return { ok: false, message: "الإعلان ليس متوقفاً مؤقتاً." };
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "active" })
    .eq("id", listingId)
    .eq("user_id", user.id);

  if (error) {
    return {
      ok: false,
      message: friendlyListingActionError(error.message),
    };
  }

  revalidateListingPaths({ listingId, ownerId: user.id });
  return { ok: true, id: listingId };
}

function friendlyListingActionError(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("paused") && (t.includes("enum") || t.includes("invalid input"))) {
    return "يجب تشغيل ترقية قاعدة البيانات: أضف قيمة paused إلى نوع حالة الإعلان في Supabase (ملف الترحيل listing_paused_status.sql).";
  }
  return raw;
}

export async function deleteListing(listingId: string): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: "الإعلان غير موجود." };
  }
  if (row.user_id !== user.id) {
    return { ok: false, message: "لا يمكنك حذف هذا الإعلان." };
  }

  const { error } = await supabase.from("listings").delete().eq("id", listingId).eq("user_id", user.id);

  if (error) {
    return { ok: false, message: friendlyListingActionError(error.message) };
  }

  revalidateListingPaths({ listingId, ownerId: user.id });
  return { ok: true, id: listingId };
}
