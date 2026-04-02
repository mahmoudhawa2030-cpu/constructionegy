"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  createHomepageItemAction,
  createHomepageSectionAction,
  deleteHomepageItemAction,
  deleteHomepageSectionAction,
  type HomepageAdminActionState,
  updateHomepageItemAction,
  updateHomepageSectionAction,
} from "@/app/admin/homepage/actions";
import { adminUi } from "@/lib/admin-ui";
import type { CategoryOption } from "@/lib/categories/queries";
import { HOMEPAGE_ICON_KEYS } from "@/lib/homepage/icons";
import type { Database } from "@/lib/supabase/database.types";

type SectionRow = Database["public"]["Tables"]["homepage_sections"]["Row"];
type ItemRow = Database["public"]["Tables"]["homepage_section_items"]["Row"];

export function AdminCreateHomepageSectionForm() {
  const t = useTranslations("adminHomepage.forms");
  const [state, formAction, pending] = useActionState(
    createHomepageSectionAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-3 p-4`} dir="ltr">
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("createSectionTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("slug")}</span>
          <input className={adminUi.inputMono} name="slug" pattern="[a-z][a-z0-9_]*" required type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sectionType")}</span>
          <select className={adminUi.select} defaultValue="grid" name="section_type">
            <option value="grid">{t("typeGrid")}</option>
            <option value="carousel">{t("typeCarousel")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={0} name="sort_order" type="number" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input className={adminUi.checkbox} defaultChecked name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleAr")}</span>
          <input className={adminUi.input} name="title_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleEn")}</span>
          <input className={adminUi.input} name="title_en" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("subtitleAr")}</span>
          <input className={adminUi.input} name="subtitle_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("subtitleEn")}</span>
          <input className={adminUi.input} name="subtitle_en" type="text" />
        </label>
      </div>
      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2`} disabled={pending} type="submit">
        {pending ? t("creating") : t("createSection")}
      </button>
    </form>
  );
}

export function AdminDeleteHomepageSectionForm({ sectionId }: { sectionId: string }) {
  const t = useTranslations("adminHomepage.forms");
  const [state, formAction, pending] = useActionState(
    deleteHomepageSectionAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form action={formAction} className="inline" onSubmit={(e) => { if (!confirm(t("confirmDeleteSection"))) e.preventDefault(); }}>
      <input name="id" type="hidden" value={sectionId} />
      <button className={adminUi.btnDanger} disabled={pending} type="submit">
        {pending ? t("deleting") : t("deleteSection")}
      </button>
      {state?.ok === false ? <span className="ms-2 text-sm text-red-600">{state.message}</span> : null}
    </form>
  );
}

export function AdminEditHomepageSectionForm({ section }: { section: SectionRow }) {
  const t = useTranslations("adminHomepage.forms");
  const [state, formAction, pending] = useActionState(
    updateHomepageSectionAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-3 p-4`} dir="ltr">
      <input name="id" type="hidden" value={section.id} />
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("editSectionTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("slug")}</span>
          <input
            className={adminUi.inputMono}
            defaultValue={section.slug}
            name="slug"
            pattern="[a-z][a-z0-9_]*"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sectionType")}</span>
          <select className={adminUi.select} defaultValue={section.section_type} name="section_type">
            <option value="grid">{t("typeGrid")}</option>
            <option value="carousel">{t("typeCarousel")}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={section.sort_order} name="sort_order" type="number" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input className={adminUi.checkbox} defaultChecked={section.enabled} name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleAr")}</span>
          <input className={adminUi.input} defaultValue={section.title_ar ?? ""} name="title_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleEn")}</span>
          <input className={adminUi.input} defaultValue={section.title_en ?? ""} name="title_en" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("subtitleAr")}</span>
          <input className={adminUi.input} defaultValue={section.subtitle_ar ?? ""} name="subtitle_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("subtitleEn")}</span>
          <input className={adminUi.input} defaultValue={section.subtitle_en ?? ""} name="subtitle_en" type="text" />
        </label>
      </div>
      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button className={`${adminUi.btnPrimary} px-4 py-2`} disabled={pending} type="submit">
          {pending ? t("saving") : t("saveSection")}
        </button>
        <Link className={adminUi.btnSecondary} href="/admin/homepage">
          {t("backToList")}
        </Link>
      </div>
    </form>
  );
}

export function AdminCreateHomepageItemForm({
  sectionId,
  categories,
}: {
  sectionId: string;
  categories: CategoryOption[];
}) {
  const t = useTranslations("adminHomepage.forms");
  const [state, formAction, pending] = useActionState(
    createHomepageItemAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} mt-6 flex flex-col gap-3 p-4`} dir="ltr">
      <input name="section_id" type="hidden" value={sectionId} />
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("createItemTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleAr")} *</span>
          <input className={adminUi.input} name="title_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("titleEn")} *</span>
          <input className={adminUi.input} name="title_en" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("descriptionAr")}</span>
          <input className={adminUi.input} name="description_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("descriptionEn")}</span>
          <input className={adminUi.input} name="description_en" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("categorySlug")}</span>
          <select className={adminUi.select} defaultValue="" name="category_slug">
            <option value="">{t("categoryNone")}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label_ar} ({c.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("href")}</span>
          <input className={adminUi.inputMono} defaultValue="/" name="href" placeholder="/gallery" type="text" />
          <span className="text-xs text-[var(--admin-text-secondary)]">{t("hrefHint")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={0} name="sort_order" type="number" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("iconKey")}</span>
          <select className={adminUi.select} defaultValue="" name="icon_key">
            <option value="">{t("iconKeyNone")}</option>
            {HOMEPAGE_ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`iconKeys.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("iconEmoji")}</span>
          <input className={adminUi.input} name="icon_emoji" placeholder="📁" type="text" />
          <span className="text-xs text-[var(--admin-text-secondary)]">{t("iconEmojiHint")}</span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("imageUrl")}</span>
          <input className={adminUi.inputMono} dir="ltr" name="image_url" placeholder="https://..." type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("badgeCount")}</span>
          <input className={adminUi.input} name="badge_count" type="number" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("badgeLabelAr")}</span>
          <input className={adminUi.input} name="badge_label_ar" type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("badgeLabelEn")}</span>
          <input className={adminUi.input} name="badge_label_en" type="text" />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input className={adminUi.checkbox} defaultChecked name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
      </div>
      <p className="text-xs text-[var(--admin-text-secondary)]">{t("itemHint")}</p>
      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2`} disabled={pending} type="submit">
        {pending ? t("creating") : t("createItem")}
      </button>
    </form>
  );
}

export function AdminEditHomepageItemForm({ item, categories }: { item: ItemRow; categories: CategoryOption[] }) {
  const t = useTranslations("adminHomepage.forms");
  const [state, formAction, pending] = useActionState(
    updateHomepageItemAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form action={formAction} className={`${adminUi.card} flex flex-col gap-2 p-3`} dir="ltr">
      <input name="id" type="hidden" value={item.id} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("titleAr")}</span>
          <input className={adminUi.input} defaultValue={item.title_ar} name="title_ar" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("titleEn")}</span>
          <input className={adminUi.input} defaultValue={item.title_en} name="title_en" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2 lg:col-span-3">
          <span className={adminUi.label}>{t("categorySlug")}</span>
          <select className={adminUi.select} defaultValue={item.category_slug ?? ""} name="category_slug">
            <option value="">{t("categoryNone")}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label_ar} ({c.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2">
          <span className={adminUi.label}>{t("href")}</span>
          <input className={adminUi.inputMono} defaultValue={item.href} name="href" type="text" />
          <span className="text-[10px] text-[var(--admin-text-secondary)]">{t("hrefHint")}</span>
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2 lg:col-span-3">
          <span className={adminUi.label}>{t("iconKey")}</span>
          <select className={adminUi.select} defaultValue={item.icon_key ?? ""} name="icon_key">
            <option value="">{t("iconKeyNone")}</option>
            {HOMEPAGE_ICON_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`iconKeys.${key}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2">
          <span className={adminUi.label}>{t("iconEmoji")}</span>
          <input className={adminUi.input} defaultValue={item.icon_emoji ?? ""} name="icon_emoji" type="text" />
          <span className="text-[10px] text-[var(--admin-text-secondary)]">{t("iconEmojiHint")}</span>
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2">
          <span className={adminUi.label}>{t("imageUrl")}</span>
          <input className={adminUi.inputMono} defaultValue={item.image_url ?? ""} dir="ltr" name="image_url" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2">
          <span className={adminUi.label}>{t("descriptionAr")}</span>
          <input className={adminUi.input} defaultValue={item.description_ar ?? ""} name="description_ar" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs sm:col-span-2">
          <span className={adminUi.label}>{t("descriptionEn")}</span>
          <input className={adminUi.input} defaultValue={item.description_en ?? ""} name="description_en" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("badgeCount")}</span>
          <input
            className={adminUi.input}
            defaultValue={item.badge_count ?? ""}
            name="badge_count"
            type="number"
          />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("badgeLabelAr")}</span>
          <input className={adminUi.input} defaultValue={item.badge_label_ar ?? ""} name="badge_label_ar" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("badgeLabelEn")}</span>
          <input className={adminUi.input} defaultValue={item.badge_label_en ?? ""} name="badge_label_en" type="text" />
        </label>
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={item.sort_order} name="sort_order" type="number" />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input className={adminUi.checkbox} defaultChecked={item.enabled} name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
      </div>
      {state?.ok === false ? <p className="text-xs text-red-600">{state.message}</p> : null}
      {state?.ok === true && state.message ? <p className="text-xs text-emerald-700">{state.message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className={adminUi.btnPrimary} disabled={pending} type="submit">
          {pending ? t("saving") : t("saveItem")}
        </button>
      </div>
    </form>
  );
}

export function AdminDeleteHomepageItemInline({ itemId }: { itemId: string }) {
  const t = useTranslations("adminHomepage.forms");
  const [delState, delAction, delPending] = useActionState(
    deleteHomepageItemAction,
    null as HomepageAdminActionState | null,
  );

  return (
    <form
      action={delAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(t("confirmDeleteItem"))) e.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={itemId} />
      <button className={adminUi.btnDanger} disabled={delPending} type="submit">
        {delPending ? t("deleting") : t("deleteItem")}
      </button>
      {delState?.ok === false ? <span className="ms-2 text-xs text-red-600">{delState.message}</span> : null}
    </form>
  );
}
