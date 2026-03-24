"use client";

import { useActionState } from "react";

import { updateProfile, type UpdateProfileState } from "@/lib/profile/actions";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const userTypeLabels: Record<ProfileRow["user_type"], string> = {
  contractor: "مقاول / مقاولات",
  supplier: "مورد / توريد",
};

type Props = {
  profile: Pick<
    ProfileRow,
    "full_name" | "user_type" | "phone_number" | "whatsapp_number" | "location" | "avatar_url"
  >;
};

export function ProfileEditForm({ profile }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, null as UpdateProfileState | null);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">تعديل الملف الشخصي</h2>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">الاسم الظاهر</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.full_name}
          name="full_name"
          required
          type="text"
        />
        {state?.ok === false && state.fieldErrors?.full_name ? (
          <span className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.full_name}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">نوع الحساب</span>
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.user_type}
          name="user_type"
          required
        >
          {(Object.keys(userTypeLabels) as ProfileRow["user_type"][]).map((key) => (
            <option key={key} value={key}>
              {userTypeLabels[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">رقم الهاتف (اختياري)</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.phone_number ?? ""}
          dir="ltr"
          inputMode="tel"
          name="phone_number"
          placeholder="+20..."
          type="text"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">واتساب (اختياري)</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.whatsapp_number ?? ""}
          dir="ltr"
          inputMode="tel"
          name="whatsapp_number"
          placeholder="+20..."
          type="text"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">الموقع أو المدينة (اختياري)</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.location ?? ""}
          name="location"
          type="text"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-700 dark:text-zinc-300">رابط صورة شخصية (اختياري)</span>
        <input
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          defaultValue={profile.avatar_url ?? ""}
          dir="ltr"
          name="avatar_url"
          placeholder="https://..."
          type="url"
        />
        {state?.ok === false && state.fieldErrors?.avatar_url ? (
          <span className="text-xs text-red-600 dark:text-red-400">{state.fieldErrors.avatar_url}</span>
        ) : null}
      </label>

      {state?.ok === false && !state.fieldErrors ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        disabled={pending}
        type="submit"
      >
        {pending ? "جاري الحفظ…" : "حفظ التغييرات"}
      </button>
    </form>
  );
}
