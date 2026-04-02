"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  createDesktopCategoryCardAction,
  deleteDesktopCategoryCardAction,
  type DesktopCategoryCardActionState,
  updateDesktopCategoryCardAction,
} from "@/app/admin/homepage/desktop-category-actions";
import { adminUi } from "@/lib/admin-ui";
import type { Database } from "@/lib/supabase/database.types";

type CardRow = Database["public"]["Tables"]["homepage_desktop_category_cards"]["Row"];

export type DesktopCategoryOption = { slug: string; label_ar: string };

export function AdminCreateDesktopCategoryCardForm({ options }: { options: DesktopCategoryOption[] }) {
  const t = useTranslations("adminHomepage.desktopCategories");
  const [state, formAction, pending] = useActionState(
    createDesktopCategoryCardAction,
    null as DesktopCategoryCardActionState | null,
  );

  if (options.length === 0) {
    return (
      <p className={`${adminUi.card} p-4 text-sm text-[var(--admin-text-secondary)]`}>{t("noCategoriesAvailable")}</p>
    );
  }

  return (
    <form
      action={formAction}
      className={`${adminUi.card} flex flex-col gap-3 p-4`}
      encType="multipart/form-data"
      dir="ltr"
    >
      <h2 className={`${adminUi.sectionTitle} text-sm`}>{t("createTitle")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("category")}</span>
          <select className={adminUi.select} name="category_slug" required>
            {options.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label_ar} ({o.slug})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={0} name="sort_order" type="number" />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className={adminUi.label}>{t("image")}</span>
          <input accept="image/jpeg,image/png,image/webp,image/gif" className={adminUi.input} name="image" required type="file" />
          <span className="text-xs text-[var(--admin-text-secondary)]">{t("imageHint")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input className={adminUi.checkbox} defaultChecked name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
      </div>
      {state?.ok === false ? <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p> : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2`} disabled={pending} type="submit">
        {pending ? t("creating") : t("create")}
      </button>
    </form>
  );
}

export function AdminEditDesktopCategoryCardForm({
  card,
  categoryLabel,
  imagePublicUrl,
}: {
  card: CardRow;
  categoryLabel: string;
  imagePublicUrl: string;
}) {
  const t = useTranslations("adminHomepage.desktopCategories");
  const [state, formAction, pending] = useActionState(
    updateDesktopCategoryCardAction,
    null as DesktopCategoryCardActionState | null,
  );

  return (
    <form
      action={formAction}
      className={`${adminUi.card} flex flex-col gap-2 p-3`}
      encType="multipart/form-data"
      dir="ltr"
    >
      <input name="id" type="hidden" value={card.id} />
      <p className="text-xs font-medium text-[var(--admin-text-primary)]">
        {t("category")}: {categoryLabel}
      </p>
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-shell-border)] bg-white">
          <Image alt="" className="object-contain p-1" fill sizes="56px" src={imagePublicUrl} unoptimized={imagePublicUrl.startsWith("http")} />
        </div>
        <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("replaceImage")}</span>
          <input accept="image/jpeg,image/png,image/webp,image/gif" className={adminUi.input} name="image" type="file" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-col gap-0.5 text-xs">
          <span className={adminUi.label}>{t("sortOrder")}</span>
          <input className={adminUi.input} defaultValue={card.sort_order} name="sort_order" type="number" />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input className={adminUi.checkbox} defaultChecked={card.enabled} name="enabled" type="checkbox" />
          <span className={adminUi.label}>{t("enabled")}</span>
        </label>
      </div>
      <p className="text-[10px] text-[var(--admin-text-secondary)]">{t("replaceImageHint")}</p>
      {state?.ok === false ? <p className="text-xs text-red-600">{state.message}</p> : null}
      {state?.ok === true && state.message ? <p className="text-xs text-emerald-700">{state.message}</p> : null}
      <button className={`${adminUi.btnPrimary} w-fit`} disabled={pending} type="submit">
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}

export function AdminDeleteDesktopCategoryCardForm({ cardId }: { cardId: string }) {
  const t = useTranslations("adminHomepage.desktopCategories");
  const [state, formAction, pending] = useActionState(
    deleteDesktopCategoryCardAction,
    null as DesktopCategoryCardActionState | null,
  );

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) e.preventDefault();
      }}
    >
      <input name="id" type="hidden" value={cardId} />
      <button className={adminUi.btnDanger} disabled={pending} type="submit">
        {pending ? t("deleting") : t("delete")}
      </button>
      {state?.ok === false ? <span className="ms-2 text-xs text-red-600">{state.message}</span> : null}
    </form>
  );
}
