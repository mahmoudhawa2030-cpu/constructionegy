"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { adminUi } from "@/lib/admin-ui";
import { saveTrackingScripts, type TrackingActionState } from "./actions";

type Props = {
  initialHeader: string;
  initialFooter: string;
};

export function TrackingForm({ initialHeader, initialFooter }: Props) {
  const t = useTranslations("adminTracking");
  const [state, action, pending] = useActionState<TrackingActionState | null, FormData>(
    saveTrackingScripts,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      {state && (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            state.ok
              ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {state.ok ? t("saved") : t("error")}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className={adminUi.label} htmlFor="header_scripts">
          {t("headerLabel")}
        </label>
        <p className="text-xs text-[var(--admin-text-secondary)]">{t("headerHint")}</p>
        <textarea
          className="min-h-48 w-full rounded-md border border-[var(--admin-shell-border)] bg-[var(--admin-card)] px-3 py-2 font-mono text-xs text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-brand)]"
          defaultValue={initialHeader}
          dir="ltr"
          id="header_scripts"
          name="header_scripts"
          placeholder={t("headerPlaceholder")}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={adminUi.label} htmlFor="footer_scripts">
          {t("footerLabel")}
        </label>
        <p className="text-xs text-[var(--admin-text-secondary)]">{t("footerHint")}</p>
        <textarea
          className="min-h-48 w-full rounded-md border border-[var(--admin-shell-border)] bg-[var(--admin-card)] px-3 py-2 font-mono text-xs text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-brand)]"
          defaultValue={initialFooter}
          dir="ltr"
          id="footer_scripts"
          name="footer_scripts"
          placeholder={t("footerPlaceholder")}
          spellCheck={false}
        />
      </div>

      <div className="flex justify-end">
        <button className={adminUi.btnPrimary} disabled={pending} type="submit">
          {pending ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
