import Link from "next/link";

import { categoryTitleForLocale, type DesktopHomeCategoryRow } from "@/lib/categories/desktop-home-queries";
import { HomepageItemIcon, isHomepageIconKey } from "@/lib/homepage/icons";

type Props = {
  categories: DesktopHomeCategoryRow[];
  locale: "ar" | "en";
  sectionTitle: string;
  cardAria: (name: string) => string;
};

export function DesktopHomeCategoryGrid({ categories, locale, sectionTitle, cardAria }: Props) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="desktop-home-categories-heading" className="w-full max-w-4xl">
      <h2
        className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        id="desktop-home-categories-heading"
      >
        {sectionTitle}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((cat) => {
          const title = categoryTitleForLocale(cat, locale);
          const href = `/gallery?category=${encodeURIComponent(cat.slug)}`;
          const iconKey = isHomepageIconKey(cat.homepage_desktop_icon_key)
            ? cat.homepage_desktop_icon_key
            : "package";
          return (
            <li key={cat.slug}>
              <Link
                aria-label={cardAria(title)}
                className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                href={href}
                prefetch={true}
              >
                <HomepageItemIcon className="h-8 w-8 text-zinc-700 dark:text-zinc-200" iconEmoji={null} iconKey={iconKey} />
                <span className="line-clamp-2 text-xs font-medium leading-tight text-zinc-900 dark:text-zinc-50 sm:text-sm">
                  {title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
