import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string | null } | null;
};

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminRfqListPage({ searchParams }: PageProps) {
  const t = await getTranslations("adminRfq.list");
  const { status: statusFilter } = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("rfq_drafts")
    .select("id, title, status, user_id, created_at, updated_at, profiles!rfq_drafts_user_id_fkey(full_name)")
    .order("updated_at", { ascending: false })
    .limit(200);

  const allowed = [
    "draft",
    "submitted",
    "open_for_bids",
    "closed",
    "archived",
    "awarded",
    "all",
  ];
  const f = typeof statusFilter === "string" && allowed.includes(statusFilter) ? statusFilter : "all";
  if (f !== "all") {
    q = q.eq("status", f);
  }

  const { data: rows, error } = await q;

  if (error) {
    return (
      <div className={adminUi.page}>
        <p className="text-sm text-red-600 dark:text-red-400">
          {t("loadError")}: {error.message}
        </p>
      </div>
    );
  }

  const list = (rows ?? []) as Row[];

  const statusLabels: Record<string, string> = {
    draft: t("statusLabel.draft"),
    submitted: t("statusLabel.submitted"),
    open_for_bids: t("statusLabel.open_for_bids"),
    closed: t("statusLabel.closed"),
    archived: t("statusLabel.archived"),
    awarded: t("statusLabel.awarded"),
  };

  const filters: { value: string; label: string }[] = [
    { value: "all", label: t("filterAll") },
    { value: "draft", label: t("filterDraft") },
    { value: "open_for_bids", label: t("filterOpen") },
    { value: "submitted", label: t("filterSubmitted") },
    { value: "closed", label: t("filterClosed") },
    { value: "archived", label: t("filterArchived") },
    { value: "awarded", label: t("filterAwarded") },
  ];

  return (
    <div className={adminUi.page}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={adminUi.pageTitle}>{t("title")}</h1>
          <p className={adminUi.pageLead}>{t("lead")}</p>
        </div>
        <Link className={adminUi.linkBack} href="/admin">
          {t("backOverview")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="navigation" aria-label={t("filtersAria")}>
        {filters.map((x) => (
          <Link
            key={x.value}
            className={`rounded-sm border px-3 py-1.5 text-xs font-semibold ${
              f === x.value
                ? "border-[var(--admin-brand)] bg-[var(--admin-brand-soft)] text-[var(--admin-brand)]"
                : "border-[var(--admin-shell-border)] bg-white text-[var(--admin-text-secondary)] dark:bg-zinc-900"
            }`}
            href={x.value === "all" ? "/admin/rfq" : `/admin/rfq?status=${x.value}`}
            prefetch={true}
          >
            {x.label}
          </Link>
        ))}
      </div>

      <div className={adminUi.widget}>
        <div className={adminUi.widgetHeader}>{t("tableTitle")}</div>
        <div className={adminUi.widgetBodyFlush}>
          <div className={adminUi.tableWrap}>
            <table className={adminUi.table}>
              <thead>
                <tr className={adminUi.theadRow}>
                  <th className={adminUi.th}>{t("colTitle")}</th>
                  <th className={adminUi.th}>{t("colBuyer")}</th>
                  <th className={adminUi.th}>{t("colStatus")}</th>
                  <th className={adminUi.th}>{t("colUpdated")}</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr className={adminUi.tbodyRow}>
                    <td className={adminUi.tdMuted} colSpan={4}>
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.id} className={adminUi.tbodyRow}>
                      <td className={adminUi.td}>
                        <Link className="font-semibold text-[var(--admin-brand)] hover:underline" href={`/admin/rfq/${r.id}`}>
                          {r.title?.trim() || t("untitled")}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr">
                          {r.id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className={adminUi.td}>
                        <Link
                          className="font-semibold text-[var(--admin-brand)] hover:underline"
                          href={`/admin/users/${r.user_id}/edit`}
                        >
                          {r.profiles?.full_name?.trim() || "—"}
                        </Link>
                        <p className="mt-0.5 font-mono text-xs text-[var(--admin-text-secondary)]" dir="ltr" title={r.user_id}>
                          {r.user_id.slice(0, 8)}…
                        </p>
                      </td>
                      <td className={`${adminUi.td} whitespace-nowrap`}>{statusLabels[r.status] ?? r.status}</td>
                      <td className={`${adminUi.tdMuted} whitespace-nowrap`}>
                        {new Date(r.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
