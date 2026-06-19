"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitDeletionRequest } from "@/lib/deletion-requests/actions";

export function DeleteAccountForm() {
  const t = useTranslations("deleteAccount");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await submitDeletionRequest(reason);
    if ("success" in result) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error === "already_pending" ? t("alreadyRequested") : "حدث خطأ، حاول مرة أخرى.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30">
        <h2 className="mb-2 text-base font-semibold text-green-900 dark:text-green-100">{t("successTitle")}</h2>
        <p className="text-sm text-green-800 dark:text-green-200">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30">
        <h2 className="mb-1 text-sm font-semibold text-red-800 dark:text-red-200">{t("warningTitle")}</h2>
        <p className="text-sm text-red-700 dark:text-red-300">{t("warningText")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="reason">
          {t("reasonLabel")}
        </label>
        <textarea
          id="reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("reasonPlaceholder")}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {status === "loading" ? "..." : t("submitButton")}
      </button>
    </form>
  );
}
