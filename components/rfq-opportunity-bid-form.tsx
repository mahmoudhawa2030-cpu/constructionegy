"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { RfqBidActionState } from "@/app/(mobile)/rfq/actions";
import { createRfqBidDraftAction } from "@/app/(mobile)/rfq/actions";

type Props = {
  draftId: string;
};

export function RfqOpportunityBidForm({ draftId }: Props) {
  const t = useTranslations("rfqOpportunity.bidForm");
  const ta = useTranslations("rfqOpportunity.bidActions");
  const [state, formAction, pending] = useActionState(createRfqBidDraftAction, null as RfqBidActionState | null);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950"
      encType="multipart/form-data"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("heading")}</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("hint")}</p>
      <input name="draft_id" type="hidden" value={draftId} />
      <label className="mt-3 block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("amountLabel")}</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          inputMode="decimal"
          name="total_amount"
          placeholder={t("amountPlaceholder")}
          type="text"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("notesLabel")}</span>
        <textarea
          className="mt-1 min-h-[5rem] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          name="supplier_notes"
          placeholder={t("notesPlaceholder")}
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t("filesLabel")}</span>
        <input
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.gif,.txt,.zip,.rar,.7z"
          aria-label={t("filesAria")}
          className="mt-1 block w-full text-sm text-zinc-600 file:me-4 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 dark:text-zinc-400 dark:file:bg-zinc-700 dark:file:text-zinc-100"
          name="bid_files"
          type="file"
        />
        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{t("filesHint")}</span>
      </label>
      <button
        className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        disabled={pending}
        type="submit"
      >
        {pending ? ta("submitting") : t("submit")}
      </button>
      {state ? (
        <p
          className={`mt-2 text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
