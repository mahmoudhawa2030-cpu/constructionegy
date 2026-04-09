"use client";

import { useActionState, useId } from "react";
import { useTranslations } from "next-intl";

import type { ExpertVerificationApplyState } from "@/app/(tabs)/profile/expert-verification-actions";
import { submitExpertVerificationApplicationAction } from "@/app/(tabs)/profile/expert-verification-actions";

type Props = {
  status: string;
  adminNotes: string | null;
  credentialsSummary: string | null;
};

export function ExpertVerificationPanel({ status, adminNotes, credentialsSummary }: Props) {
  const t = useTranslations("expertVerification");
  const summaryLabelId = useId();
  const [state, formAction, pending] = useActionState(
    submitExpertVerificationApplicationAction,
    null as ExpertVerificationApplyState | null,
  );

  const canApply = status === "none" || status === "rejected";

  return (
    <section
      className="scroll-mt-24 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40"
      id="expert-verification"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t("heading")}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("intro")}</p>

      {status === "verified" ? (
        <p className="mt-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">{t("statusVerified")}</p>
      ) : null}
      {status === "pending" ? (
        <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">{t("statusPending")}</p>
      ) : null}
      {status === "rejected" && adminNotes ? (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {t("rejectionPrefix")} {adminNotes}
        </p>
      ) : status === "rejected" ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("statusRejected")}</p>
      ) : null}
      {status === "none" ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("statusNone")}</p> : null}

      {credentialsSummary?.trim() && status !== "none" ? (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-600 dark:bg-zinc-950">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{t("submittedSummaryLabel")}</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300" dir="auto">
            {credentialsSummary.trim()}
          </p>
        </div>
      ) : null}

      {canApply ? (
        <form action={formAction} className="mt-4 flex flex-col gap-2">
          <label className="flex flex-col gap-1" htmlFor={summaryLabelId}>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{t("summaryLabel")}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("summaryHint")}</span>
            <textarea
              className="min-h-[8rem] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              defaultValue={credentialsSummary?.trim() ?? ""}
              id={summaryLabelId}
              maxLength={2000}
              name="credentials_summary"
              placeholder={t("summaryPlaceholder")}
              required
            />
          </label>
          <button
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            disabled={pending}
            type="submit"
          >
            {pending ? t("applySubmitting") : t("applySubmit")}
          </button>
          {state ? (
            <p
              className={
                state.ok
                  ? "text-sm text-emerald-700 dark:text-emerald-300"
                  : "text-sm text-red-600 dark:text-red-400"
              }
              role="status"
            >
              {state.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
