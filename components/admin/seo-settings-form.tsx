"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { saveSiteSeoFromForm, type SeoSettingsActionState } from "@/app/admin/seo/actions";
import { adminUi } from "@/lib/admin-ui";
import type { SiteSeoSettings } from "@/lib/seo/site-settings";

type Props = {
  baseUrl: string;
  settings: SiteSeoSettings;
};

export function SeoSettingsForm({ baseUrl, settings }: Props) {
  const t = useTranslations("adminSeoSettings");
  const [state, formAction, pending] = useActionState(saveSiteSeoFromForm, null as SeoSettingsActionState | null);

  const org = settings.organizationSchema;
  const web = settings.websiteSchema;

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-5 p-5`}>
      <section className="flex flex-col gap-3">
        <h2 className={adminUi.sectionTitle}>{t("sectionBrand")}</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelSiteName")}</span>
          <input className={adminUi.input} defaultValue={org.name} name="site_name" required type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelBaseUrl")}</span>
          <input className={adminUi.inputMono} defaultValue={baseUrl} dir="ltr" name="base_url" required type="url" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelLogo")}</span>
          <input
            className={adminUi.inputMono}
            defaultValue={org.logo ?? ""}
            dir="ltr"
            name="logo"
            placeholder="https://example.com/logo.png"
            type="url"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelSameAs")}</span>
          <textarea
            className={adminUi.inputMono}
            defaultValue={(org.sameAs ?? []).join("\n")}
            dir="ltr"
            name="same_as"
            placeholder={t("placeholderSameAs")}
            rows={3}
          />
          <span className={adminUi.footnote}>{t("hintSameAs")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelDescription")}</span>
          <textarea className={adminUi.input} defaultValue={org.description ?? ""} name="description" rows={2} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelSearchTarget")}</span>
          <input
            className={adminUi.inputMono}
            defaultValue={web.potentialAction?.target ?? ""}
            dir="ltr"
            name="search_target"
            placeholder="https://example.com/gallery?q={search_term_string}"
            type="text"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={adminUi.sectionTitle}>{t("sectionMeta")}</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelTitleTemplate")}</span>
          <input className={adminUi.inputMono} defaultValue={settings.metaTitleTemplate} dir="ltr" name="title_template" required type="text" />
          <span className={adminUi.footnote}>{t("hintTitleTemplate")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelDescriptionTemplate")}</span>
          <input className={adminUi.inputMono} defaultValue={settings.metaDescriptionTemplate} dir="ltr" name="description_template" required type="text" />
          <span className={adminUi.footnote}>{t("hintDescriptionTemplate")}</span>
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={adminUi.sectionTitle}>{t("sectionRobots")}</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("labelRobotsTxt")}</span>
          <textarea
            className={adminUi.inputMono}
            defaultValue={settings.robotsTxt}
            dir="ltr"
            name="robots_txt"
            rows={14}
          />
        </label>
      </section>

      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p> : null}

      <button className={`${adminUi.btnPrimary} w-fit px-6 py-2 text-sm`} disabled={pending} type="submit">
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
