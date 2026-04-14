import Link from "next/link";
import { getTranslations } from "next-intl/server";

export type RfqBidRowForTable = {
  id: string;
  supplier_user_id: string;
  total_amount: number | null;
  currency: string;
  status: string;
  supplier_notes: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

type Props = {
  bids: RfqBidRowForTable[];
};

export async function RfqBiddersTable({ bids }: Props) {
  const t = await getTranslations("rfqDraft.bidders");

  if (bids.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("empty")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table aria-label={t("caption")} className="w-full min-w-[20rem] text-start text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-800">
          <tr>
            <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t("supplier")}</th>
            <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t("price")}</th>
            <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t("date")}</th>
            <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t("status")}</th>
            <th className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">{t("notes")}</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((b) => {
            const name = b.profiles?.full_name?.trim() || t("unknownSupplier");
            const price =
              b.total_amount != null
                ? `${Number(b.total_amount).toLocaleString()} ${b.currency}`
                : "—";
            return (
              <tr key={b.id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">
                  <Link
                    className="font-medium text-zinc-900 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600 dark:text-zinc-100 dark:decoration-zinc-500 dark:hover:decoration-zinc-300"
                    href={`/profile/${b.supplier_user_id}`}
                    prefetch={true}
                  >
                    {name}
                  </Link>
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-800 dark:text-zinc-200">{price}</td>
                <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                  {new Date(b.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{b.status}</td>
                <td
                  className="max-w-[12rem] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400"
                  title={b.supplier_notes ?? undefined}
                >
                  {b.supplier_notes?.trim() || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
