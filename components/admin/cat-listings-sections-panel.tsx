"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import {
  createCatListingsSectionAction,
  deleteCatListingsSectionAction,
  updateCatListingsSectionAction,
  type WebHomepageActionState,
} from "@/app/admin/homepage/web-actions";
import { adminUi } from "@/lib/admin-ui";

type SectionRow = {
  id: string;
  slug: string;
  categorySlug: string;
  title_ar: string | null;
  title_en: string | null;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  sort_order: number;
  enabled: boolean;
};

type CategoryOption = { slug: string; label_ar: string };

type Props = {
  sections: SectionRow[];
  categoryOptions: CategoryOption[];
};

function Labeled({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className={adminUi.label}>{label}</span>
      {children}
    </label>
  );
}

function SectionRow({
  section,
  categoryOptions,
}: {
  section: SectionRow;
  categoryOptions: CategoryOption[];
}) {
  const t = useTranslations("adminWebHomepage");
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateCatListingsSectionAction,
    null as WebHomepageActionState | null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCatListingsSectionAction,
    null as WebHomepageActionState | null,
  );

  const catLabel =
    categoryOptions.find((c) => c.slug === section.categorySlug)?.label_ar ??
    section.categorySlug;

  return (
    <li className="rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-zebra-odd)]">
      {/* Summary row */}
      <div className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--admin-text)] truncate">
            {section.title_ar || section.title_en || catLabel}
          </p>
          <p className="text-xs text-[var(--admin-text-secondary)] truncate">
            🗂 {catLabel} · slug: {section.slug} · order: {section.sort_order} ·{" "}
            {section.enabled ? (
              <span className="text-emerald-600">{t("catSectionEnabled")}</span>
            ) : (
              <span className="text-amber-600">{t("catSectionDisabled")}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={`${adminUi.btnToolbar} px-3 py-1`}
        >
          {editing ? t("cancel") : t("edit")}
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={section.id} />
          <button
            type="submit"
            className={`${adminUi.btnDanger} px-3 py-1`}
            disabled={deletePending}
            onClick={(e) => {
              if (!confirm(t("catSectionConfirmDelete"))) e.preventDefault();
            }}
          >
            {deletePending ? t("catSectionDeleting") : t("catSectionDelete")}
          </button>
        </form>
      </div>
      {deleteState && !deleteState.ok && (
        <p className="px-3 pb-2 text-xs text-red-600">{deleteState.message}</p>
      )}

      {/* Inline edit form */}
      {editing && (
        <form
          action={updateAction}
          className="border-t border-[var(--admin-cell-border)] p-3 grid gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={section.id} />

          <Labeled label={t("catSectionTitleAr")}>
            <input name="title_ar" defaultValue={section.title_ar ?? ""} className={adminUi.input} />
          </Labeled>
          <Labeled label={t("catSectionTitleEn")}>
            <input name="title_en" defaultValue={section.title_en ?? ""} className={adminUi.input} />
          </Labeled>
          <Labeled label={t("catSectionSubtitleAr")}>
            <input name="subtitle_ar" defaultValue={section.subtitle_ar ?? ""} className={adminUi.input} />
          </Labeled>
          <Labeled label={t("catSectionSubtitleEn")}>
            <input name="subtitle_en" defaultValue={section.subtitle_en ?? ""} className={adminUi.input} />
          </Labeled>
          <Labeled label={t("catSectionSortOrder")}>
            <input
              name="sort_order"
              type="number"
              defaultValue={section.sort_order}
              className={`${adminUi.input} w-24`}
            />
          </Labeled>
          <Labeled label={t("catSectionEnabled")}>
            <input
              name="enabled"
              type="checkbox"
              defaultChecked={section.enabled}
              className={`${adminUi.checkbox} mt-1`}
            />
          </Labeled>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className={`${adminUi.btnPrimary} px-4 py-1.5`}
              disabled={updatePending}
            >
              {updatePending ? t("catSectionSaving") : t("catSectionSave")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={`${adminUi.btnSecondary} px-4 py-1.5`}
            >
              {t("cancel")}
            </button>
            {updateState && !updateState.ok && (
              <p className="text-xs text-red-600">{updateState.message}</p>
            )}
            {updateState?.ok && (
              <p className="text-xs text-emerald-600">{updateState.message}</p>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function CreateForm({ categoryOptions }: { categoryOptions: CategoryOption[] }) {
  const t = useTranslations("adminWebHomepage");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createCatListingsSectionAction,
    null as WebHomepageActionState | null,
  );

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${adminUi.btnPrimary} px-4 py-2`}
        >
          + {t("catSectionAddTitle")}
        </button>
      ) : (
        <div className="rounded-sm border border-dashed border-[var(--admin-brand)] bg-[var(--admin-card-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--admin-text)] mb-3">
            {t("catSectionAddTitle")}
          </p>
          <form action={formAction} className="grid gap-3 sm:grid-cols-2">
            <Labeled label={t("catSectionCategory")} className="sm:col-span-2">
              <select
                name="category_slug"
                required
                className={adminUi.input}
                defaultValue=""
              >
                <option value="" disabled>
                  {t("catSectionPickCategory")}
                </option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label_ar} ({c.slug})
                  </option>
                ))}
              </select>
            </Labeled>

            <Labeled label={t("catSectionTitleAr")}>
              <input name="title_ar" className={adminUi.input} placeholder="مثال: مواد البناء" />
            </Labeled>
            <Labeled label={t("catSectionTitleEn")}>
              <input name="title_en" className={adminUi.input} placeholder="e.g. Steel Structures" />
            </Labeled>
            <Labeled label={t("catSectionSubtitleAr")}>
              <input name="subtitle_ar" className={adminUi.input} placeholder="اكتشف أحدث الإعلانات" />
            </Labeled>
            <Labeled label={t("catSectionSubtitleEn")}>
              <input name="subtitle_en" className={adminUi.input} placeholder="Browse the latest listings" />
            </Labeled>
            <Labeled label={t("catSectionSortOrder")}>
              <input
                name="sort_order"
                type="number"
                defaultValue={100}
                className={`${adminUi.input} w-24`}
              />
            </Labeled>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className={`${adminUi.btnPrimary} px-4 py-1.5`}
                disabled={pending}
              >
                {pending ? t("catSectionCreating") : t("catSectionCreate")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`${adminUi.btnSecondary} px-4 py-1.5`}
              >
                {t("cancel")}
              </button>
              {state && !state.ok && (
                <p className="text-xs text-red-600">{state.message}</p>
              )}
              {state?.ok && (
                <p className="text-xs text-emerald-600">{state.message}</p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function CatListingsSectionsPanel({ sections, categoryOptions }: Props) {
  const t = useTranslations("adminWebHomepage");

  return (
    <section className={adminUi.widget}>
      <div className={`${adminUi.widgetHeader} flex flex-col gap-0.5`}>
        <span className="font-bold">{t("catSectionsTitle")}</span>
        <span className="text-xs opacity-70">{t("catSectionsLead")}</span>
      </div>
      <div className={`${adminUi.widgetBody} flex flex-col gap-4`}>
        {sections.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-secondary)]">{t("catSectionEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sections.map((section) => (
              <SectionRow key={section.id} section={section} categoryOptions={categoryOptions} />
            ))}
          </ul>
        )}
        <CreateForm categoryOptions={categoryOptions} />
      </div>
    </section>
  );
}
