"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { AdminRfqActionState } from "@/app/admin/rfq/actions";
import { adminUpdateRfqDraftStatusAction } from "@/app/admin/rfq/actions";

import { adminUi } from "@/lib/admin-ui";

const STATUSES = ["draft", "submitted", "open_for_bids", "closed", "archived", "awarded"] as const;

type Props = {
  draftId: string;
  currentStatus: string;
  moderationNotePreview: string | null;
};

export function AdminRfqDraftModerationForm({ draftId, currentStatus, moderationNotePreview }: Props) {
  const t = useTranslations("adminRfq.detail.moderationForm");
  const ta = useTranslations("adminRfq.actions");
  const [state, formAction, pending] = useActionState(adminUpdateRfqDraftStatusAction, null as AdminRfqActionState | null);

  return (
    <div className={adminUi.cardPadded}>
      <h2 className="text-sm font-semibold text-[var(--admin-table-header-text)]">{t("heading")}</h2>
      <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">{t("hint")}</p>
      {moderationNotePreview ? (
        <p className="mt-2 text-xs text-[var(--admin-text-secondary)]">
          {t("lastNote")}: {moderationNotePreview}
        </p>
      ) : null}
      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <input name="draft_id" type="hidden" value={draftId} />
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--admin-text-secondary)]">{t("statusLabel")}</span>
          <select
            className="rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-2 py-1.5 text-sm"
            defaultValue={STATUSES.includes(currentStatus as (typeof STATUSES)[number]) ? currentStatus : "draft"}
            disabled={pending}
            name="status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`statusOption.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--admin-text-secondary)]">{t("noteLabel")}</span>
          <textarea
            className="min-h-[4rem] rounded-sm border border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] px-2 py-1.5 text-sm"
            disabled={pending}
            name="moderation_note"
            placeholder={t("notePlaceholder")}
          />
        </label>
        <button
          className={`${adminUi.btnPrimary} w-fit`}
          disabled={pending}
          type="submit"
        >
          {pending ? ta("saving") : t("submit")}
        </button>
      </form>
      {state ? (
        <p
          className={`mt-2 text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
