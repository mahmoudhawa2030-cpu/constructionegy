"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { AdminVerificationActionState } from "@/app/admin/verifications/actions";
import { adminApproveBusinessVerification, adminRejectBusinessVerification } from "@/app/admin/verifications/actions";

import { adminUi } from "@/lib/admin-ui";

type Props = {
  userId: string;
};

export function AdminBusinessVerificationActions({ userId }: Props) {
  const t = useTranslations("adminVerifications.detail.actions");
  const [approveState, approveAction, approvePending] = useActionState(
    adminApproveBusinessVerification,
    null as AdminVerificationActionState | null,
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    adminRejectBusinessVerification,
    null as AdminVerificationActionState | null,
  );
  const state = approveState ?? rejectState;

  return (
    <div className="flex flex-col gap-4">
      <form action={approveAction} className="flex flex-wrap items-end gap-2">
        <input name="user_id" type="hidden" value={userId} />
        <button className={adminUi.btnPrimary} disabled={approvePending || rejectPending} type="submit">
          {approvePending ? t("approving") : t("approve")}
        </button>
      </form>
      <form action={rejectAction} className="flex flex-col gap-2">
        <input name="user_id" type="hidden" value={userId} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--admin-text-secondary)]">{t("rejectNotes")}</span>
          <textarea
            className="min-h-[4rem] rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-2 py-1.5 text-sm"
            name="notes"
            placeholder={t("rejectPlaceholder")}
          />
        </label>
        <button className={`${adminUi.btnSecondary} w-fit`} disabled={approvePending || rejectPending} type="submit">
          {rejectPending ? t("rejecting") : t("reject")}
        </button>
      </form>
      {state ? (
        <p
          className={`text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
