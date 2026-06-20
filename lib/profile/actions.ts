"use server";

import { revalidatePath } from "next/cache";

import { updateProfileSchema } from "@/lib/profile/schema";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function updateProfile(
  _prev: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "يجب تسجيل الدخول أولاً." };
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

  const body = parsed.data;

  if (body.phone_number) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone_number", body.phone_number)
      .neq("id", user.id)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        message: "رقم الهاتف مسجّل لدى مستخدم آخر. الرجاء استخدام رقم مختلف.",
        fieldErrors: { phone_number: "رقم الهاتف مسجّل بالفعل" },
      };
    }
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: body.full_name,
      user_type: body.user_type,
      phone_number: body.phone_number,
      whatsapp_number: body.whatsapp_number,
      location: body.location,
      avatar_url: body.avatar_url,
    },
    { onConflict: "id" },
  );

  if (error) {
    if (error.code === "23505" && error.message.includes("phone_number")) {
      return {
        ok: false,
        message: "رقم الهاتف مسجّل لدى مستخدم آخر. الرجاء استخدام رقم مختلف.",
        fieldErrors: { phone_number: "رقم الهاتف مسجّل بالفعل" },
      };
    }
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/messages");
  return { ok: true, message: "تم حفظ الملف الشخصي." };
}
