import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { DesktopHomeCategoryGrid } from "@/components/desktop-home-category-grid";
import { HomepageCarousel } from "@/components/homepage-carousel";
import { HomepageServiceGrid } from "@/components/homepage-service-grid";
import { fetchDesktopHomeCards } from "@/lib/categories/desktop-home-queries";
import { fetchGuestHomepageContent } from "@/lib/homepage/guest-data";
import { createClient } from "@/lib/supabase/server";

type Props = {
  showDesktopFallback?: boolean;
  /** When CMS is empty or on desktop fallback, signed-in users get My ads / profile instead of login / signup. */
  isSignedIn?: boolean;
};

export async function GuestConfigurableHome({ showDesktopFallback = true, isSignedIn = false }: Props) {
  const supabase = await createClient();
  const [{ sections, itemsBySectionId }, desktopHomeCards] = await Promise.all([
    fetchGuestHomepageContent(supabase),
    fetchDesktopHomeCards(supabase),
  ]);
  const localeRaw = await getLocale();
  const loc = localeRaw === "en" ? "en" : "ar";
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");

  const hasSectionCms =
    sections.length > 0 && sections.some((s) => (itemsBySectionId.get(s.id) ?? []).length > 0);
  const hasDesktopHomeCardsCms = desktopHomeCards.length > 0;
  const hasAnyHomeContent = hasSectionCms || hasDesktopHomeCardsCms;

  const mobileInner = !hasAnyHomeContent ? (
    <div className="flex flex-col gap-6 px-4 py-8">
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">{t("cmsEmpty")}</p>
      <nav className="flex flex-col gap-3 font-medium">
        {isSignedIn ? (
          <>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-white dark:bg-zinc-100 dark:text-zinc-900"
              href="/gallery"
            >
              {t("gallery")}
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 dark:border-zinc-600 dark:bg-zinc-900"
              href="/users/myads"
            >
              {t("myAds")}
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 dark:border-zinc-600 dark:bg-zinc-900"
              href="/profile"
            >
              {tn("profile")}
            </Link>
          </>
        ) : (
          <>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-white dark:bg-zinc-100 dark:text-zinc-900"
              href="/login"
            >
              {t("login")}
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 dark:border-zinc-600 dark:bg-zinc-900"
              href="/signup"
            >
              {t("signup")}
            </Link>
            <Link
              className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-5 dark:border-zinc-600 dark:bg-zinc-900"
              href="/gallery"
            >
              {t("gallery")}
            </Link>
          </>
        )}
      </nav>
    </div>
  ) : (
    <div className="flex flex-col gap-8 px-3 pb-10 pt-4 sm:px-4">
      {hasSectionCms
        ? sections.map((section) => {
            const items = itemsBySectionId.get(section.id) ?? [];
            if (items.length === 0) return null;
            const secTitle =
              loc === "ar"
                ? section.title_ar?.trim() || section.title_en?.trim()
                : section.title_en?.trim() || section.title_ar?.trim();
            const secSub =
              loc === "ar"
                ? section.subtitle_ar?.trim() || section.subtitle_en?.trim()
                : section.subtitle_en?.trim() || section.subtitle_ar?.trim();

            return (
              <section key={section.id} aria-labelledby={secTitle ? `home-sec-${section.id}` : undefined}>
                {secTitle ? (
                  <div className="mb-3">
                    <h2
                      className="text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg"
                      id={`home-sec-${section.id}`}
                    >
                      {secTitle}
                    </h2>
                    {secSub ? (
                      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{secSub}</p>
                    ) : null}
                  </div>
                ) : null}
                {section.section_type === "carousel" ? (
                  <HomepageCarousel
                    dotLabel={(n) => t("carouselDotAria", { n })}
                    items={items}
                    locale={loc}
                    slideAria={(title) => t("slideLinkAria", { title })}
                  />
                ) : (
                  <HomepageServiceGrid cardAria={(title) => t("cardLinkAria", { title })} items={items} locale={loc} />
                )}
              </section>
            );
          })
        : null}
      {hasDesktopHomeCardsCms ? (
        <DesktopHomeCategoryGrid
          cardAria={(name) => t("desktopCategoryCardAria", { category: name })}
          categories={desktopHomeCards}
          locale={loc}
          sectionTitle={t("desktopCategoriesTitle")}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <div
        className={`flex min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 ${showDesktopFallback ? "lg:hidden" : ""}`}
        dir={loc === "ar" ? "rtl" : "ltr"}
      >
        <header className="flex items-center justify-center border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {tc("brandName")}
          </span>
        </header>
        {mobileInner}
      </div>

      {showDesktopFallback ? (
        <div className="hidden min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-black lg:flex" dir={loc === "ar" ? "rtl" : "ltr"}>
          <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-8 py-16">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
              <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">{t("intro")}</p>
            </div>
            <DesktopHomeCategoryGrid
              cardAria={(name) => t("desktopCategoryCardAria", { category: name })}
              categories={desktopHomeCards}
              locale={loc}
              sectionTitle={t("desktopCategoriesTitle")}
            />
            <nav className="flex flex-wrap justify-center gap-3">
              {isSignedIn ? (
                <>
                  <Link
                    className="rounded-full bg-zinc-900 px-6 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    href="/gallery"
                  >
                    {t("gallery")}
                  </Link>
                  <Link className="rounded-full border border-zinc-300 px-6 py-3 dark:border-zinc-600" href="/users/myads">
                    {t("myAds")}
                  </Link>
                  <Link className="rounded-full border border-zinc-300 px-6 py-3 dark:border-zinc-600" href="/profile">
                    {tn("profile")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-full bg-zinc-900 px-6 py-3 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    href="/login"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    className="rounded-full border border-zinc-300 px-6 py-3 dark:border-zinc-600"
                    href="/signup"
                  >
                    {t("signup")}
                  </Link>
                  <Link
                    className="rounded-full border border-zinc-300 px-6 py-3 dark:border-zinc-600"
                    href="/gallery"
                  >
                    {t("gallery")}
                  </Link>
                </>
              )}
            </nav>
            <p className="text-center text-xs text-zinc-500">{t("desktopHomeHint")}</p>
          </main>
        </div>
      ) : null}
    </>
  );
}
