"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  createRedirectFromForm,
  deleteRedirectFromForm,
  type RedirectActionState,
  updateRedirectFromForm,
} from "@/app/admin/redirects/actions";
import { adminUi } from "@/lib/admin-ui";

const STATUS_CODES = [301, 302, 307, 308] as const;

export type RedirectRow = {
  id: string;
  source_path: string;
  destination_path: string;
  status_code: number;
  is_active: boolean;
  hit_count: number;
};

export function CreateRedirectForm({ initialSource }: { initialSource?: string } = {}) {
  const t = useTranslations("adminRedirects");
  const [state, formAction, pending] = useActionState(createRedirectFromForm, null as RedirectActionState | null);

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-3 p-4`}>
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("addTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldSource")}</span>
          <input
            className={adminUi.inputMono}
            defaultValue={initialSource}
            dir="ltr"
            name="source_path"
            placeholder="/old-path"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldDestination")}</span>
          <input
            className={adminUi.inputMono}
            dir="ltr"
            name="destination_path"
            placeholder="/new-path"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("fieldStatus")}</span>
          <select className={adminUi.select} defaultValue={301} name="status_code">
            {STATUS_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input className={adminUi.checkbox} defaultChecked name="is_active" type="checkbox" />
          <span className={adminUi.label}>{t("fieldActive")}</span>
        </label>
      </div>
      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2 text-sm`} disabled={pending} type="submit">
        {pending ? t("adding") : t("add")}
      </button>
    </form>
  );
}

export function EditRedirectForm({ row }: { row: RedirectRow }) {
  const t = useTranslations("adminRedirects");
  const [state, formAction, pending] = useActionState(updateRedirectFromForm, null as RedirectActionState | null);

  return (
    <div className="min-w-0 w-full max-w-full">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input name="id" type="hidden" value={row.id} />
        <input
          className={`${adminUi.inputMono} min-w-[10rem] shrink-0 px-2 py-1.5 text-xs`}
          defaultValue={row.source_path}
          dir="ltr"
          name="source_path"
          required
          type="text"
        />
        <span className="text-xs text-[var(--admin-text-secondary)]">&rarr;</span>
        <input
          className={`${adminUi.inputMono} min-w-[10rem] shrink-0 px-2 py-1.5 text-xs`}
          defaultValue={row.destination_path}
          dir="ltr"
          name="destination_path"
          required
          type="text"
        />
        <select className={`${adminUi.select} shrink-0`} defaultValue={row.status_code} name="status_code">
          {STATUS_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs">
          <input className={adminUi.checkbox} defaultChecked={row.is_active} name="is_active" type="checkbox" />
          <span className={adminUi.label}>{t("fieldActive")}</span>
        </label>
        <button className={`${adminUi.btnPrimary} shrink-0`} disabled={pending} type="submit">
          {pending ? "…" : t("save")}
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

export function DeleteRedirectForm({ id }: { id: string }) {
  const t = useTranslations("adminRedirects");
  const [state, formAction, pending] = useActionState(deleteRedirectFromForm, null as RedirectActionState | null);

  return (
    <form
      action={formAction}
      className="flex shrink-0 flex-nowrap items-center gap-2"
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) {
          e.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      {state?.ok === false ? (
        <span className="max-w-[12rem] truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </span>
      ) : null}
      <button className={`${adminUi.btnDanger} shrink-0`} disabled={pending} type="submit">
        {pending ? "…" : t("delete")}
      </button>
    </form>
  );
}
