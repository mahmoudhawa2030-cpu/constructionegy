"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { setSubscriptionEnforcementFromForm, type SubscriptionActionState } from "@/app/admin/subscriptions/actions";
import { adminUi } from "@/lib/admin-ui";

type Props = { initialEnabled: boolean };

export function AdminSubscriptionEnforcementForm({ initialEnabled }: Props) {
  const t = useTranslations("adminSubscriptions.enforcement");
  const [state, action, pending] = useActionState<SubscriptionActionState | null, FormData>(
    setSubscriptionEnforcementFromForm,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--admin-text)]">
        <input
          className={adminUi.checkbox}
          defaultChecked={initialEnabled}
          name="enforce_subscriptions"
          type="checkbox"
          value="on"
        />
        {t("label")}
      </label>
      <p className="text-xs leading-relaxed text-[var(--admin-text-secondary)]">{t("hint")}</p>
      {state && !state.ok ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit`} disabled={pending} type="submit">
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
