"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { adminUi } from "@/lib/admin-ui";
import { setFeedPostVeteransCorner } from "@/lib/feed/admin-veterans-actions";

export type VeteransCornerRow = {
  id: string;
  title: string;
  created_at: string;
  is_veterans_corner: boolean;
  authorName: string;
};

export function AdminVeteransCornerTable({ rows }: { rows: VeteransCornerRow[] }) {
  const t = useTranslations("adminVeteransCorner");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(row: VeteransCornerRow, enabled: boolean) {
    setErr(null);
    setPendingId(row.id);
    startTransition(async () => {
      const res = await setFeedPostVeteransCorner(row.id, enabled);
      setPendingId(null);
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <p className={adminUi.placeholderTile}>{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {err ? (
        <div className={adminUi.messageStripWarn} role="alert">
          {err}
        </div>
      ) : null}
      <div className={adminUi.tableWrap}>
        <table className={adminUi.table}>
          <thead>
            <tr className={adminUi.theadRow}>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colTitle")}</th>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colAuthor")}</th>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colDate")}</th>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colVeterans")}</th>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colLink")}</th>
              <th className={`${adminUi.th} p-3 text-start`}>{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const busy = pending && pendingId === row.id;
              return (
                <tr key={row.id} className={adminUi.tbodyRow}>
                  <td className={`${adminUi.td} max-w-[14rem] truncate p-3`} title={row.title}>
                    {row.title}
                  </td>
                  <td className={`${adminUi.td} p-3`}>{row.authorName}</td>
                  <td className={`${adminUi.td} p-3 tabular-nums`}>
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className={`${adminUi.td} p-3`}>
                    <span
                      className={
                        row.is_veterans_corner
                          ? "rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-950 dark:bg-amber-900/40 dark:text-amber-100"
                          : `${adminUi.tdMuted} text-xs`
                      }
                    >
                      {row.is_veterans_corner ? t("badgeVeterans") : t("badgeStandard")}
                    </span>
                  </td>
                  <td className={`${adminUi.td} p-3`}>
                    <Link
                      className={adminUi.linkEmphasized}
                      href={`/posts/${row.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("openPost")}
                    </Link>
                  </td>
                  <td className={`${adminUi.td} p-3`}>
                    {row.is_veterans_corner ? (
                      <button
                        type="button"
                        className={adminUi.btnSecondary}
                        disabled={busy}
                        onClick={() => toggle(row, false)}
                      >
                        {busy ? t("working") : t("demote")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={adminUi.btnPrimary}
                        disabled={busy}
                        onClick={() => toggle(row, true)}
                      >
                        {busy ? t("working") : t("promote")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
