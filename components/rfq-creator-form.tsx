"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { RfqDraftUiActionState } from "@/app/(tabs)/rfq/actions";
import {
  reopenRfqAction,
  saveRfqDraftDetailsAction,
  submitRfqDraftForBidsAction,
} from "@/app/(tabs)/rfq/actions";
import { isoToDatetimeLocalValue } from "@/lib/rfq/closing-date";

type Props = {
  draftId: string;
  initialTitle: string | null;
  initialDescription: string | null;
  initialLocation: string | null;
  initialClosingDateIso: string | null;
  status: string;
};

export function RfqCreatorForm({
  draftId,
  initialTitle,
  initialDescription,
  initialLocation,
  initialClosingDateIso,
  status,
}: Props) {
  const t = useTranslations("rfqDraft");
  const ta = useTranslations("rfqDraft.actions");
  const isDraft = status === "draft";
  const isOpen = status === "open_for_bids" || status === "submitted";
  const isClosed = status === "closed";

  const [saveState, saveAction, savePending] = useActionState(saveRfqDraftDetailsAction, null as RfqDraftUiActionState | null);
  const [submitState, submitAction, submitPending] = useActionState(
    submitRfqDraftForBidsAction,
    null as RfqDraftUiActionState | null,
  );
  const [reopenState, reopenAction, reopenPending] = useActionState(reopenRfqAction, null as RfqDraftUiActionState | null);

  const feedback = saveState ?? submitState ?? reopenState;

  const statusLabel = isDraft ? t("statusDraft") : isOpen ? t("statusOpen") : isClosed ? t("statusClosed") : t("statusEnded");

  const closingLocal = isoToDatetimeLocalValue(initialClosingDateIso);

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
                : isClosed
                  ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                  : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {!isDraft ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("fieldsLockedHint")}</p>
      ) : null}

      <form className="mt-3 flex flex-col gap-3">
        <input name="draft_id" type="hidden" value={draftId} />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("titleLabel")}</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initialTitle ?? ""}
            disabled={!isDraft || savePending || submitPending}
            name="title"
            placeholder={t("titlePlaceholder")}
            type="text"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("descriptionLabel")}</span>
          <textarea
            className="min-h-[8rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initialDescription ?? ""}
            disabled={!isDraft || savePending || submitPending}
            name="description"
            placeholder={t("descriptionPlaceholder")}
            rows={8}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("locationLabel")}</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={initialLocation ?? ""}
            disabled={!isDraft || savePending || submitPending}
            name="location"
            placeholder={t("locationPlaceholder")}
            type="text"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("closingDateLabel")}</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            defaultValue={closingLocal}
            disabled={!isDraft || savePending || submitPending}
            name="closing_date"
            type="datetime-local"
          />
        </label>

        {isDraft ? (
          <div className="flex flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700 sm:flex-row sm:flex-wrap">
            <button
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={savePending || submitPending}
              formAction={saveAction}
              type="submit"
            >
              {savePending ? ta("saving") : t("saveDraft")}
            </button>
            <button
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-emerald-600"
              disabled={savePending || submitPending}
              formAction={submitAction}
              type="submit"
            >
              {submitPending ? ta("publishing") : t("publishButton")}
            </button>
          </div>
        ) : null}

        {isDraft ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("publishHint")}</p> : null}
      </form>

      {isClosed ? (
        <form action={reopenAction} className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <input name="draft_id" type="hidden" value={draftId} />
          <button
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-amber-700"
            disabled={reopenPending}
            type="submit"
          >
            {reopenPending ? ta("reopening") : t("reopenButton")}
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
