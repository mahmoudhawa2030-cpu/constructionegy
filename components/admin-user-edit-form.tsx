"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { updateAdminUserProfile } from "@/app/admin/users/actions";
import { adminUi } from "@/lib/admin-ui";
import type { UpdateProfileState } from "@/lib/profile/actions";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const userTypeLabels: Record<ProfileRow["user_type"], string> = {
  contractor: "مقاول / مقاولات",
  supplier: "مورد / توريد",
};

type Props = {
  profile: Pick<
    ProfileRow,
    "id" | "full_name" | "user_type" | "phone_number" | "whatsapp_number" | "location" | "avatar_url"
  >;
  /** Sign-in email from Auth (read-only). */
  email: string | null;
  emailLoadIssue: "service_role" | "fetch_failed" | null;
};

export function AdminUserEditForm({ profile, email, emailLoadIssue }: Props) {
  const tEmail = useTranslations("adminUserEdit");
  const [state, formAction, pending] = useActionState(
    updateAdminUserProfile,
    null as UpdateProfileState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-4 p-5`}>
      <input name="user_id" type="hidden" value={profile.id} />

      <div className="flex flex-col gap-1 text-sm">
        <span className={adminUi.label}>{tEmail("emailLabel")}</span>
        {emailLoadIssue === "service_role" ? (
          <p className="text-xs leading-relaxed text-[var(--admin-text-secondary)]">{tEmail("emailNeedsServiceRole")}</p>
        ) : emailLoadIssue === "fetch_failed" ? (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {tEmail("emailFetchFailed")}
          </p>
        ) : (
          <>
            <input
              readOnly
              aria-label={tEmail("emailLabel")}
              className={`${adminUi.input} cursor-not-allowed bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200`}
              dir="ltr"
              type="email"
              value={email ?? ""}
            />
            <p className="text-xs text-[var(--admin-text-secondary)]">{tEmail("emailReadOnlyHint")}</p>
          </>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className={adminUi.label}>الاسم الظاهر</span>
        <input
          className={adminUi.input}
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
        <span className={adminUi.label}>نوع الحساب</span>
        <select
          className={`${adminUi.select} px-3 py-2 text-sm`}
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
        <span className={adminUi.label}>رقم الهاتف (اختياري)</span>
        <input
          className={adminUi.input}
          defaultValue={profile.phone_number ?? ""}
          dir="ltr"
          inputMode="tel"
          name="phone_number"
          placeholder="+20..."
          type="text"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className={adminUi.label}>واتساب (اختياري)</span>
        <input
          className={adminUi.input}
          defaultValue={profile.whatsapp_number ?? ""}
          dir="ltr"
          inputMode="tel"
          name="whatsapp_number"
          placeholder="+20..."
          type="text"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className={adminUi.label}>الموقع أو المدينة (اختياري)</span>
        <input
          className={adminUi.input}
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
        className={`${adminUi.btnPrimary} w-fit px-4 py-2.5 text-sm`}
        disabled={pending}
        type="submit"
      >
        {pending ? "جاري الحفظ…" : "حفظ التغييرات"}
      </button>
    </form>
  );
}
