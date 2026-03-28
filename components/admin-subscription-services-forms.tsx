"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  createSubscriptionServiceFromForm,
  updateSubscriptionServiceFromForm,
  type SubscriptionServiceActionState,
} from "@/app/admin/subscription-services/actions";
import type { SubscriptionServiceRow } from "@/lib/subscriptions/services-queries";
import { adminUi } from "@/lib/admin-ui";

export function CreateSubscriptionServiceForm() {
  const t = useTranslations("adminSubscriptionServices");
  const [state, formAction, pending] = useActionState(
    createSubscriptionServiceFromForm,
    null as SubscriptionServiceActionState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-3 p-4`}>
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("createTitle")}</h2>
      <p className="text-xs leading-relaxed text-[var(--admin-text-secondary)]">{t("createHint")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldKey")}</span>
          <input
            className={adminUi.inputMono}
            dir="ltr"
            name="feature_key"
            pattern="[a-z][a-z0-9_]*"
            placeholder="e.g. contractor_leads"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldSort")}</span>
          <input className={adminUi.input} defaultValue={100} name="sort_order" type="number" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldLabelAr")}</span>
          <input className={adminUi.input} name="label_ar" required type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldLabelEn")}</span>
          <input className={adminUi.input} dir="ltr" name="label_en" required type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="flex cursor-pointer items-center gap-2">
            <input className={adminUi.checkbox} defaultChecked name="requires_subscription" type="checkbox" />
            <span className={adminUi.label}>{t("fieldPaid")}</span>
          </span>
          <span className="text-xs text-[var(--admin-text-secondary)]">{t("fieldPaidHint")}</span>
        </label>
      </div>
      {state?.ok === false ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2 text-sm`} disabled={pending} type="submit">
        {pending ? t("creating") : t("createSubmit")}
      </button>
    </form>
  );
}

export function EditSubscriptionServiceForm({ row }: { row: SubscriptionServiceRow }) {
  const t = useTranslations("adminSubscriptionServices");
  const [state, formAction, pending] = useActionState(
    updateSubscriptionServiceFromForm,
    null as SubscriptionServiceActionState | null,
  );

  return (
    <div className="min-w-0 w-full max-w-full">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <input name="feature_key" type="hidden" value={row.feature_key} />
        <span
          className={`${adminUi.inputMono} inline-flex min-w-[6rem] max-w-[10rem] shrink-0 items-center px-2 py-1.5 text-xs`}
          dir="ltr"
          title={row.feature_key}
        >
          {row.feature_key}
        </span>
        <input
          className={`${adminUi.input} w-[min(100%,12rem)] shrink-0 px-2 py-1.5 text-xs`}
          defaultValue={row.label_ar}
          name="label_ar"
          required
          type="text"
        />
        <input
          className={`${adminUi.input} w-[min(100%,12rem)] shrink-0 px-2 py-1.5 text-xs`}
          defaultValue={row.label_en}
          dir="ltr"
          name="label_en"
          required
          type="text"
        />
        <input
          className={`${adminUi.input} w-14 shrink-0 px-2 py-1.5 text-xs tabular-nums`}
          defaultValue={row.sort_order}
          name="sort_order"
          type="number"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs">
          <input
            className={adminUi.checkbox}
            defaultChecked={row.requires_subscription}
            name="requires_subscription"
            type="checkbox"
          />
          <span className={adminUi.label}>{t("fieldPaidShort")}</span>
        </label>
        <button className={`${adminUi.btnPrimary} shrink-0`} disabled={pending} type="submit">
          {pending ? "…" : t("saveRow")}
        </button>
      </form>
      {state?.ok === false ? (
        <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="mt-1 truncate text-xs text-emerald-700 dark:text-emerald-400" title={state.message}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
