import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSiteUrl } from "@/lib/seo/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  const canonical = `${getSiteUrl()}/privacy`;
  return {
    title: t("title"),
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const collectItems = t.raw("collectItems") as string[];
  const useItems = t.raw("useItems") as string[];
  const rightsItems = t.raw("rightsItems") as string[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-bina-text">{t("title")}</h1>
      <p className="mb-8 text-sm text-bina-muted">{t("lastUpdated")}</p>

      <p className="mb-8 leading-relaxed text-bina-text">{t("intro")}</p>

      {/* Collect */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("collectTitle")}</h2>
        <ul className="list-disc space-y-2 ps-5 text-bina-text">
          {collectItems.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      </section>

      {/* Use */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("useTitle")}</h2>
        <ul className="list-disc space-y-2 ps-5 text-bina-text">
          {useItems.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      </section>

      {/* Share */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("shareTitle")}</h2>
        <p className="leading-relaxed text-bina-text">{t("shareText")}</p>
      </section>

      {/* Storage */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("storageTitle")}</h2>
        <p className="leading-relaxed text-bina-text">{t("storageText")}</p>
      </section>

      {/* Rights */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("rightsTitle")}</h2>
        <ul className="list-disc space-y-2 ps-5 text-bina-text">
          {rightsItems.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      </section>

      {/* Children */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("childrenTitle")}</h2>
        <p className="leading-relaxed text-bina-text">{t("childrenText")}</p>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-bina-text">{t("contactTitle")}</h2>
        <p className="mb-2 leading-relaxed text-bina-text">{t("contactText")}</p>
        <ul className="space-y-1 text-bina-text">
          <li>
            <a className="text-bina-or hover:underline" href={`mailto:${t("contactEmail")}`}>
              {t("contactEmail")}
            </a>
          </li>
          <li>
            <a className="text-bina-or hover:underline" href={t("contactSite")} target="_blank" rel="noopener noreferrer">
              {t("contactSite")}
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
