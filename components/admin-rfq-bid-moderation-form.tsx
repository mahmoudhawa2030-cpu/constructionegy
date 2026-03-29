"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { AdminRfqActionState } from "@/app/admin/rfq/actions";
import { adminUpdateRfqBidStatusAction } from "@/app/admin/rfq/actions";

import { adminUi } from "@/lib/admin-ui";

const BID_STATUSES = ["draft", "submitted", "withdrawn", "accepted", "rejected"] as const;

type Props = {
  bidId: string;
  currentStatus: string;
};

export function AdminRfqBidModerationForm({ bidId, currentStatus }: Props) {
  const t = useTranslations("adminRfq.detail.bidForm");
  const ta = useTranslations("adminRfq.actions");
  const [state, formAction, pending] = useActionState(adminUpdateRfqBidStatusAction, null as AdminRfqActionState | null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="bid_id" type="hidden" value={bidId} />
      <label className="flex flex-col gap-0.5">
        <span className="sr-only">{t("statusLabel")}</span>
        <select
          className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-2 py-1 text-xs"
          defaultValue={BID_STATUSES.includes(currentStatus as (typeof BID_STATUSES)[number]) ? currentStatus : "draft"}
          disabled={pending}
          name="status"
        >
          {BID_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statusOption.${s}`)}
            </option>
          ))}
        </select>
      </label>
      <button className={`${adminUi.btnSecondary} px-2 py-1 text-xs`} disabled={pending} type="submit">
        {pending ? ta("saving") : t("submit")}
      </button>
      {state && !state.ok ? (
        <span className="text-xs text-red-600 dark:text-red-400">{state.message}</span>
      ) : null}
    </form>
  );
}
