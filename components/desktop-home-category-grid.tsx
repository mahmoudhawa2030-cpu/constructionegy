import Image from "next/image";
import Link from "next/link";

import { desktopCardTitleForLocale, type DesktopHomeCardItem } from "@/lib/categories/desktop-home-queries";

type Props = {
  categories: DesktopHomeCardItem[];
  locale: "ar" | "en";
  sectionTitle: string;
  cardAria: (name: string) => string;
};

export function DesktopHomeCategoryGrid({ categories, locale, sectionTitle, cardAria }: Props) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="desktop-home-categories-heading" className="w-full max-w-4xl">
      <h2
        className="font-bina-display mb-4 text-center text-lg font-bold tracking-wide text-bina-text"
        id="desktop-home-categories-heading"
      >
        {sectionTitle}
      </h2>
      <ul className="grid grid-cols-4 gap-1.5 sm:gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {categories.map((card) => {
          const title = desktopCardTitleForLocale(card, locale);
          return (
            <li key={card.id}>
              <Link
                aria-label={cardAria(title)}
                className="flex min-h-[5.85rem] flex-col items-center justify-center gap-[0.1625rem] rounded-[var(--bina-r)] border border-bina-border bg-bina-card px-[0.1625rem] py-[0.65rem] text-center shadow-sm transition hover:border-bina-or/40 hover:shadow-md sm:min-h-[6.5rem] sm:gap-1.5 sm:rounded-xl sm:px-[0.325rem] sm:py-[0.8125rem] md:min-h-[7.15rem] md:gap-2 md:px-[0.65rem] md:py-[0.975rem]"
                href={card.href}
                prefetch={true}
              >
                <span className="relative flex h-[3.51rem] w-[3.51rem] items-center justify-center sm:h-[3.9rem] sm:w-[3.9rem] md:h-[4.68rem] md:w-[4.68rem]">
                  <Image
                    alt=""
                    className="object-contain"
                    fill
                    sizes="(max-width: 640px) 56px, (max-width: 768px) 62px, 75px"
                    src={card.image_public_url}
                    unoptimized={card.image_public_url.startsWith("http")}
                  />
                </span>
                <span className="font-bina-display line-clamp-2 text-[11.7px] font-semibold leading-tight text-bina-text sm:text-[14.3px] md:text-[0.975rem] lg:text-[1.1375rem]">
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
