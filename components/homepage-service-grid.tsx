import Link from "next/link";

import { resolveHomepageItemHref, type GuestHomepageItem } from "@/lib/homepage/guest-data";
import { HomepageItemIcon } from "@/lib/homepage/icons";

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
    <ul className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((item) => {
        const title = locale === "ar" ? item.title_ar || item.title_en : item.title_en || item.title_ar;
        const badge = badgeText(item, locale);
        const itemHref = resolveHomepageItemHref(item);
        return (
          <li key={item.id}>
            <Link
              aria-label={cardAria(title)}
              className="relative flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-lg border border-zinc-200 bg-white px-0.5 py-2 text-center shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 sm:min-h-[5rem] sm:gap-1 sm:rounded-xl sm:px-1 sm:py-2.5"
              href={itemHref}
              prefetch={true}
            >
              <span aria-hidden className="absolute start-1 top-1 h-1 w-1 rounded-full bg-amber-500 sm:start-1.5 sm:top-1.5 sm:h-1.5 sm:w-1.5" />
              {badge ? (
                <span className="absolute end-0.5 top-0.5 max-w-[2.25rem] truncate rounded bg-violet-100 px-0.5 py-px text-[8px] font-semibold leading-none text-violet-900 dark:bg-violet-950/80 dark:text-violet-100 sm:end-1 sm:top-1 sm:max-w-[3rem] sm:px-1 sm:py-0.5 sm:text-[10px]">
                  {badge}
                </span>
              ) : null}
              <HomepageItemIcon
                className="h-6 w-6 text-zinc-700 dark:text-zinc-200 sm:h-7 sm:w-7"
                emojiClassName="text-lg leading-none sm:text-xl md:text-2xl"
                iconEmoji={item.icon_emoji}
                iconKey={item.icon_key}
              />
              <span className="line-clamp-2 text-[9px] font-medium leading-tight text-zinc-900 dark:text-zinc-50 sm:text-[11px] md:text-xs">
                {title}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
