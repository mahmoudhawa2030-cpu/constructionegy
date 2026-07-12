"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  deleteNotFoundFromForm,
  dismissNotFoundFromForm,
  type NotFoundActionState,
} from "@/app/admin/not-found-log/actions";
import { adminUi } from "@/lib/admin-ui";

export function DismissNotFoundForm({ id }: { id: string }) {
  const t = useTranslations("adminNotFound");
  const [state, formAction, pending] = useActionState(dismissNotFoundFromForm, null as NotFoundActionState | null);

  return (
    <form action={formAction} className="flex shrink-0 items-center gap-1">
      <input name="id" type="hidden" value={id} />
      {state?.ok === false ? (
        <span className="max-w-[10rem] truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </span>
      ) : null}
      <button className={`${adminUi.btnGhost} shrink-0`} disabled={pending} type="submit">
        {pending ? "…" : t("dismiss")}
      </button>
    </form>
  );
}

export function DeleteNotFoundForm({ id }: { id: string }) {
  const t = useTranslations("adminNotFound");
  const [state, formAction, pending] = useActionState(deleteNotFoundFromForm, null as NotFoundActionState | null);

  return (
    <form
      action={formAction}
      className="flex shrink-0 items-center gap-1"
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) {
          e.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      {state?.ok === false ? (
        <span className="max-w-[10rem] truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </span>
      ) : null}
      <button className={`${adminUi.btnDanger} shrink-0`} disabled={pending} type="submit">
        {pending ? "…" : t("delete")}
      </button>
    </form>
  );
}
