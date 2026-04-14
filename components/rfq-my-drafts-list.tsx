import Link from "next/link";
import { getTranslations } from "next-intl/server";

export type RfqDraftListRow = {
  id: string;
  title: string | null;
  status: string;
  updated_at: string;
};

function badgeForStatus(status: string, t: (key: string) => string): string {
  if (status === "draft") return t("badgeDraft");
  if (status === "open_for_bids" || status === "submitted") return t("badgeOpen");
  if (status === "closed") return t("badgeClosed");
  return t("badgeOther");
}

export async function RfqMyDraftsList({ drafts }: { drafts: RfqDraftListRow[] }) {
  const t = await getTranslations("rfqDraft.myDrafts");

  if (drafts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("heading")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("heading")}</h2>
        <Link
          className="text-xs font-medium text-zinc-700 underline dark:text-zinc-300"
          href="/rfq?new=1"
          prefetch={true}
        >
          {t("newDraft")}
        </Link>
      </div>
      <ul className="mt-3 flex flex-col gap-2" aria-label={t("listAria")}>
        {drafts.map((d) => (
          <li key={d.id}>
            <Link
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              href={`/rfq?draft=${d.id}`}
              prefetch={true}
            >
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-50">
                {d.title?.trim() || t("untitled")}
              </span>
              <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{badgeForStatus(d.status, t)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
