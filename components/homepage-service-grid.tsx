import Link from "next/link";

import type { GuestHomepageItem } from "@/lib/homepage/guest-data";

type Props = {
  items: GuestHomepageItem[];
  locale: "ar" | "en";
  cardAria: (title: string) => string;
};

function badgeText(item: GuestHomepageItem, locale: "ar" | "en"): string | null {
  if (item.badge_count != null && item.badge_count !== undefined) {
    return String(item.badge_count);
  }
  const lbl =
    locale === "ar"
      ? item.badge_label_ar?.trim() || item.badge_label_en?.trim()
      : item.badge_label_en?.trim() || item.badge_label_ar?.trim();
  return lbl && lbl.length > 0 ? lbl : null;
}

export function HomepageServiceGrid({ items, locale, cardAria }: Props) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item) => {
        const title = locale === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar;
        const badge = badgeText(item, locale);
        const icon = item.icon_emoji?.trim() || "·";
        return (
          <li key={item.id}>
            <Link
              aria-label={cardAria(title)}
              className="relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white px-1 py-3 text-center shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              href={item.href}
              prefetch={true}
            >
              <span aria-hidden className="absolute start-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
              {badge ? (
                <span className="absolute end-1 top-1 max-w-[3.5rem] truncate rounded-md bg-violet-100 px-1 py-0.5 text-[10px] font-semibold leading-none text-violet-900 dark:bg-violet-950/80 dark:text-violet-100">
                  {badge}
                </span>
              ) : null}
              <span className="text-2xl leading-none" aria-hidden>
                {icon}
              </span>
              <span className="line-clamp-2 text-[11px] font-medium leading-tight text-zinc-900 dark:text-zinc-50 sm:text-xs">
                {title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
