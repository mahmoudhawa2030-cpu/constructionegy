"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { RfqDraftUiActionState } from "@/app/(tabs)/rfq/actions";
import { saveRfqDraftTitleAction, submitRfqDraftForBidsAction } from "@/app/(tabs)/rfq/actions";

type Props = {
  draftId: string;
  initialTitle: string | null;
  status: string;
};

export function RfqDraftControls({ draftId, initialTitle, status }: Props) {
  const t = useTranslations("rfqDraft");
  const ta = useTranslations("rfqDraft.actions");
  const isDraft = status === "draft";
  const isOpen = status === "open_for_bids" || status === "submitted";

  const [saveState, saveAction, savePending] = useActionState(saveRfqDraftTitleAction, null as RfqDraftUiActionState | null);
  const [submitState, submitAction, submitPending] = useActionState(
    submitRfqDraftForBidsAction,
    null as RfqDraftUiActionState | null,
  );

  const feedback = saveState ?? submitState;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("draftHeading")}</h2>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
            isDraft
              ? "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100"
              : isOpen
                ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100"
                : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
          }`}
        >
          {isDraft ? t("statusDraft") : isOpen ? t("statusOpen") : t("statusEnded")}
        </span>
      </div>

      {!isDraft ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("lockedUploadHint")}</p>
      ) : null}

      <form action={saveAction} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <input name="draft_id" type="hidden" value={draftId} />
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("titleLabel")}</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initialTitle ?? ""}
            disabled={savePending}
            name="title"
            placeholder={t("titlePlaceholder")}
            type="text"
          />
        </label>
        <button
          className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100"
          disabled={savePending}
          type="submit"
        >
          {savePending ? ta("saving") : t("saveTitle")}
        </button>
      </form>

      {isDraft ? (
        <form action={submitAction} className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <input name="draft_id" type="hidden" value={draftId} />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("publishHint")}</p>
          <button
            className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-emerald-600"
            disabled={submitPending}
            type="submit"
          >
            {submitPending ? ta("publishing") : t("publishButton")}
          </button>
        </form>
      ) : null}

      {feedback ? (
        <p
          className={`mt-3 text-sm ${feedback.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
