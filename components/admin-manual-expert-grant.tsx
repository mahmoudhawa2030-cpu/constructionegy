"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  adminGrantExpertManually,
  adminSearchProfilesForManualExpert,
  type AdminExpertVerificationActionState,
  type AdminManualExpertSearchRow,
} from "@/app/admin/expert-verifications/actions";
import { adminUi } from "@/lib/admin-ui";

function expertStatusKey(status: string): "statusVerified" | "statusPending" | "statusNone" | "statusRejected" {
  switch (status) {
    case "verified":
      return "statusVerified";
    case "pending":
      return "statusPending";
    case "rejected":
      return "statusRejected";
    default:
      return "statusNone";
  }
}

export function AdminManualExpertGrant() {
  const t = useTranslations("adminExpertVerifications.manual");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminManualExpertSearchRow[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const searchGen = useRef(0);

  const [grantState, grantAction, grantPending] = useActionState(
    adminGrantExpertManually,
    null as AdminExpertVerificationActionState | null,
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setRows([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const g = ++searchGen.current;
    setSearching(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      void (async () => {
        const res = await adminSearchProfilesForManualExpert(q);
        if (searchGen.current !== g) {
          return;
        }
        setSearching(false);
        if (res.ok) {
          setRows(res.rows);
        } else {
          setRows([]);
          setSearchError(res.message);
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [query, open]);

  return (
    <div className={adminUi.widget}>
      <div className={`${adminUi.widgetHeader} flex flex-wrap items-center justify-between gap-2`}>
        <span>{t("panelTitle")}</span>
        <button
          aria-expanded={open}
          className={adminUi.btnSecondary}
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          {open ? t("closePanel") : t("openButton")}
        </button>
      </div>
      {open ? (
        <div className={`${adminUi.widgetBody} flex flex-col gap-4`}>
          <p className={adminUi.sectionLead}>{t("lead")}</p>

          <label className="flex flex-col gap-1">
            <span className={adminUi.label}>{t("searchLabel")}</span>
            <input
              aria-label={t("searchAria")}
              autoComplete="off"
              className={adminUi.input}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
            />
            <span className={adminUi.footnote}>{t("searchHint")}</span>
          </label>

          {searching ? (
            <p className="text-sm text-[var(--admin-text-secondary)]">{t("searching")}</p>
          ) : null}
          {searchError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {searchError}
            </p>
          ) : null}

          {!searching && query.trim().length >= 2 && rows.length === 0 && !searchError ? (
            <p className="text-sm text-[var(--admin-text-secondary)]">{t("noResults")}</p>
          ) : null}

          {rows.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {rows.map((r) => {
                const verified = r.expert_verification_status === "verified";
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-card-bg)] px-3 py-2"
                    key={r.id}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                        <Link className="text-[var(--admin-brand)] hover:underline" href={`/admin/expert-verifications/${r.id}`}>
                          {r.full_name?.trim() || "—"}
                        </Link>
                      </p>
                      <p className="font-mono text-xs text-[var(--admin-text-secondary)] rtl:text-right" dir="ltr">
                        {r.id.slice(0, 8)}…
                        {r.phone_number ? ` · ${r.phone_number}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--admin-text-secondary)]">
                        {t("statusLabel")}: {t(expertStatusKey(r.expert_verification_status))}
                      </p>
                    </div>
                    <form action={grantAction}>
                      <input name="user_id" type="hidden" value={r.id} />
                      <button
                        className={adminUi.btnPrimary}
                        disabled={verified || grantPending}
                        type="submit"
                      >
                        {grantPending ? t("granting") : t("grantButton")}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {grantState ? (
            <p
              className={`text-sm ${grantState.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
              role="status"
            >
              {grantState.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
