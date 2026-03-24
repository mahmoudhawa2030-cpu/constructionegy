import type { ReactNode } from "react";

import { ListingCard } from "@/components/listing-card";
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

type Props = {
  title: string;
  listings: ListingRow[];
  empty: ReactNode;
  categoryLabelMap: Record<string, string>;
  showViewCount?: boolean;
};

export function ProfileListingsGrid({
  title,
  listings,
  empty,
  categoryLabelMap,
  showViewCount = true,
}: Props) {
  if (listings.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
          {empty}
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {listings.map((row) => (
          <li key={row.id}>
            <ListingCard
              categoryLabelMap={categoryLabelMap}
              listing={row}
              showViewCount={showViewCount}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
