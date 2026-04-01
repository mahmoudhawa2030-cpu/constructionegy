"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import type { RfqBidActionState } from "@/app/(tabs)/rfq/actions";
import { addRfqBidDraftAttachmentsAction } from "@/app/(tabs)/rfq/actions";

type Props = {
  bidId: string;
};

export function RfqBidAddFilesForm({ bidId }: Props) {
  const t = useTranslations("rfqOpportunity.bidAttachments");
  const tf = useTranslations("rfqOpportunity.bidForm");
  const [state, formAction, pending] = useActionState(
    addRfqBidDraftAttachmentsAction,
    null as RfqBidActionState | null,
  );

  return (
    <form
      action={formAction}
      className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700"
      encType="multipart/form-data"
    >
      <input name="bid_id" type="hidden" value={bidId} />
      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{t("addHeading")}</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("addHint")}</p>
      <label className="mt-2 block">
        <input
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.dwg,.dxf,.jpg,.jpeg,.png,.webp,.gif,.txt,.zip,.rar,.7z"
          aria-label={tf("filesAria")}
          className="mt-1 block w-full text-sm text-zinc-600 file:me-4 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 dark:text-zinc-400 dark:file:bg-zinc-700 dark:file:text-zinc-100"
          name="bid_files"
          required
          type="file"
        />
      </label>
      <button
        className="mt-3 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900"
        disabled={pending}
        type="submit"
      >
        {pending ? t("addSubmitting") : t("addSubmit")}
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
