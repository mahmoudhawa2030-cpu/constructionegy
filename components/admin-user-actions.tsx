"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  banUserFromForm,
  deleteUserFromForm,
  type AdminUserActionState,
  unbanUserFromForm,
} from "@/app/admin/users/actions";
import { adminUi } from "@/lib/admin-ui";

type Props = {
  userId: string;
  isAdmin: boolean;
  isBanned: boolean;
  isSelf: boolean;
};

export function AdminUserActions({ userId, isAdmin, isBanned, isSelf }: Props) {
  const [banState, banAction, banPending] = useActionState(banUserFromForm, null as AdminUserActionState | null);
  const [unbanState, unbanAction, unbanPending] = useActionState(
    unbanUserFromForm,
    null as AdminUserActionState | null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteUserFromForm,
    null as AdminUserActionState | null,
  );

  const disabled = isSelf || isAdmin;
  const canEdit = !isAdmin || isSelf;

  const message = banState?.ok === false
    ? banState.message
    : unbanState?.ok === false
      ? unbanState.message
      : deleteState?.ok === false
        ? deleteState.message
        : null;
  const success =
    banState?.ok === true
      ? banState.message
      : unbanState?.ok === true
        ? unbanState.message
        : deleteState?.ok === true
          ? deleteState.message
          : null;

  const disabledTitle = disabled
    ? isSelf
      ? "لا يمكن حظر أو حذف حسابك من هنا."
      : "لا يمكن حظر أو حذف حسابات الإداريين."
    : undefined;

  return (
    <div className="min-w-[13.5rem] max-w-[16rem]">
      <div
        className="flex flex-nowrap items-center justify-end gap-1.5"
        title={disabledTitle}
      >
        {canEdit ? (
          <Link
            className={`${adminUi.btnSecondary} shrink-0 no-underline`}
            href={`/admin/users/${userId}/edit`}
          >
            تعديل
          </Link>
        ) : null}
        <Link
          className={`${adminUi.btnGhost} shrink-0 no-underline`}
          href={`/admin/users/${userId}/subscriptions`}
        >
          اشتراكات
        </Link>
        {isBanned ? (
          <form action={unbanAction} className="inline-flex shrink-0">
            <input name="user_id" type="hidden" value={userId} />
            <button
              className={`${adminUi.btnGhost} disabled:opacity-50`}
              disabled={disabled || unbanPending}
              type="submit"
            >
              {unbanPending ? "…" : "إلغاء الحظر"}
            </button>
          </form>
        ) : (
          <form action={banAction} className="inline-flex shrink-0">
            <input name="user_id" type="hidden" value={userId} />
            <button
              className={`${adminUi.btnAttention} disabled:opacity-50`}
              disabled={disabled || banPending}
              type="submit"
            >
              {banPending ? "…" : "حظر"}
            </button>
          </form>
        )}
        <form
          action={deleteAction}
          className="inline-flex shrink-0"
          onSubmit={(e) => {
            if (!confirm("حذف هذا المستخدم نهائياً من النظام؟ لا يمكن التراجع.")) {
              e.preventDefault();
            }
          }}
        >
          <input name="user_id" type="hidden" value={userId} />
          <button
            className={`${adminUi.btnDanger} disabled:opacity-50`}
            disabled={disabled || deletePending}
            type="submit"
          >
            {deletePending ? "…" : "حذف"}
          </button>
        </form>
      </div>
      {(message || success) && (
        <p
          className={`mt-1 truncate text-[11px] ${message ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
          title={message ?? success ?? undefined}
        >
          {message ?? success}
        </p>
      )}
    </div>
  );
}
