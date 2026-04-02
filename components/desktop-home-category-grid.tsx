import Image from "next/image";
import Link from "next/link";

import { categoryTitleForLocale, type DesktopHomeCategoryRow } from "@/lib/categories/desktop-home-queries";

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
      <ul className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {categories.map((cat) => {
          const title = categoryTitleForLocale(cat, locale);
          const href = `/gallery?category=${encodeURIComponent(cat.slug)}`;
          return (
            <li key={cat.slug}>
              <Link
                aria-label={cardAria(title)}
                className="flex min-h-[5.85rem] flex-col items-center justify-center gap-[0.1625rem] rounded-lg border border-zinc-200 bg-white px-[0.1625rem] py-[0.65rem] text-center shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 sm:min-h-[6.5rem] sm:gap-1.5 sm:rounded-xl sm:px-[0.325rem] sm:py-[0.8125rem] md:min-h-[7.15rem] md:gap-2 md:px-[0.65rem] md:py-[0.975rem]"
                href={href}
                prefetch={true}
              >
                <span className="relative flex h-[2.925rem] w-[2.925rem] items-center justify-center sm:h-[3.25rem] sm:w-[3.25rem] md:h-[3.9rem] md:w-[3.9rem]">
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    sizes="(max-width: 640px) 47px, (max-width: 768px) 52px, 62px"
                    src={cat.image_public_url}
                    unoptimized={cat.image_public_url.startsWith("http")}
                  />
                </span>
                <span className="line-clamp-2 text-[11.7px] font-medium leading-tight text-zinc-900 dark:text-zinc-50 sm:text-[14.3px] md:text-[0.975rem] lg:text-[1.1375rem]">
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
