"use client";

import { useActionState } from "react";
import {
  deleteSubscriptionFromForm,
  updateSubscriptionFromForm,
  type SubscriptionActionState,
} from "@/app/admin/subscriptions/actions";
import { adminUi } from "@/lib/admin-ui";

type Props = {
  id: string;
  userId: string;
  validUntil: string | null;
  notes: string | null;
};

export function AdminSubscriptionDeleteBtn({ id, userId }: Pick<Props, "id" | "userId">) {
  const [, action, pending] = useActionState<SubscriptionActionState | null, FormData>(
    deleteSubscriptionFromForm,
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="user_id" value={userId} />
      <button
        className={adminUi.btnDanger}
        disabled={pending}
        type="submit"
        onClick={(e) => {
          if (!window.confirm("حذف هذا الاشتراك؟")) e.preventDefault();
        }}
      >
        {pending ? "…" : "حذف"}
      </button>
    </form>
  );
}

export function AdminSubscriptionEditForm({ id, userId, validUntil, notes }: Props) {
  const [state, action, pending] = useActionState<SubscriptionActionState | null, FormData>(
    updateSubscriptionFromForm,
    null,
  );

  const defaultDate = validUntil ? new Date(validUntil).toISOString().slice(0, 10) : "";

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-semibold text-[var(--admin-text-secondary)]">
          صالح حتى
        </label>
        <input
          className={`${adminUi.input} w-36`}
          defaultValue={defaultDate}
          name="valid_until"
          type="date"
        />
      </div>
      <div className="flex flex-col gap-0.5 min-w-[12rem] flex-1">
        <label className="text-[10px] font-semibold text-[var(--admin-text-secondary)]">
          ملاحظات
        </label>
        <input
          className={adminUi.input}
          defaultValue={notes ?? ""}
          maxLength={500}
          name="notes"
          type="text"
        />
      </div>
      <button className={adminUi.btnSecondary} disabled={pending} type="submit">
        {pending ? "…" : "حفظ"}
      </button>
      {state && !state.ok ? (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok ? (
        <p className="w-full text-xs text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
    </form>
  );
}
