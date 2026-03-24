"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  banUserFromForm,
  deleteUserFromForm,
  type AdminUserActionState,
  unbanUserFromForm,
} from "@/app/admin/users/actions";

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
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-900 no-underline hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            href={`/admin/users/${userId}/edit`}
          >
            تعديل
          </Link>
        ) : null}
        {isBanned ? (
          <form action={unbanAction} className="inline-flex shrink-0">
            <input name="user_id" type="hidden" value={userId} />
            <button
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
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
              className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-950 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
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
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-900 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
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
