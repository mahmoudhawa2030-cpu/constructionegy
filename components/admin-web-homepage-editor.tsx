"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  createWebItemAction,
  deleteWebItemAction,
  toggleWebSectionAction,
  updateWebItemAction,
  updateWebSectionAction,
  type WebHomepageActionState,
} from "@/app/admin/homepage/web-actions";
import { adminUi } from "@/lib/admin-ui";
import type {
  WebHomeItem,
  WebHomeSection,
  WebHomeSectionSlug,
} from "@/lib/homepage/web-home-data";

/**
 * Field set displayed per section type.
 * - hero_slider: image, kicker, title, description, cta_label, href
 * - categories_strip: category_slug, icon_emoji, bg/fg color, title override
 * - flash_deals: listing_id picker, badge (discount), title override
 * - trending: listing_id picker, title override
 * - promo_banners: bg_color, kicker, title, cta_label, href
 * - featured_suppliers: supplier_id picker, title override (display name)
 */
type FormShape =
  | "title"
  | "description"
  | "kicker"
  | "cta_label"
  | "href"
  | "image_url"
  | "category_slug"
  | "listing_id"
  | "supplier_id"
  | "icon_emoji"
  | "bg_color"
  | "fg_color"
  | "badge_count"
  | "badge_label";

const FIELD_PRESETS: Record<WebHomeSectionSlug, FormShape[]> = {
  web_hero_slider: [
    "image_url",
    "kicker",
    "title",
    "description",
    "cta_label",
    "href",
  ],
  web_categories_strip: [
    "category_slug",
    "title",
    "icon_emoji",
    "bg_color",
    "fg_color",
  ],
  web_flash_deals: ["listing_id", "title", "badge_label", "badge_count"],
  web_trending: ["listing_id", "title"],
  web_promo_banners: ["bg_color", "kicker", "title", "cta_label", "href"],
  web_featured_suppliers: ["supplier_id", "title"],
};

type Props = {
  section: WebHomeSection;
  sectionSlug: WebHomeSectionSlug;
  /** Optional picker data — listings or suppliers depending on section */
  listingOptions?: Array<{ id: string; title: string; price: number }>;
  supplierOptions?: Array<{ id: string; name: string }>;
  categoryOptions?: Array<{ slug: string; label_ar: string }>;
};

export function AdminWebHomepageEditor({
  section,
  sectionSlug,
  listingOptions = [],
  supplierOptions = [],
  categoryOptions = [],
}: Props) {
  const t = useTranslations("adminWebHomepage");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fields = FIELD_PRESETS[sectionSlug];

  return (
    <section className={adminUi.widget}>
      <div className={`${adminUi.widgetHeader} flex items-center justify-between gap-3`}>
        <div className="flex flex-col">
          <span className="font-bold">{labelForSection(sectionSlug, t)}</span>
          <code className="text-[10px] opacity-70">{section.slug}</code>
        </div>
        <SectionToggle section={section} t={t} />
      </div>

      <div className={adminUi.widgetBody}>
        {/* Section metadata editor (titles/subtitles) */}
        <SectionMetaForm section={section} t={t} />

        {/* Items list */}
        <h3 className="mt-4 mb-2 text-sm font-semibold text-[var(--admin-text)]">
          {t("itemsTitle", { count: section.items.length })}
        </h3>

        {section.items.length === 0 ? (
          <p className="text-sm text-[var(--admin-text-secondary)] mb-3">
            {t("noItems")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 mb-3">
            {section.items.map((item) => (
              <li
                key={item.id}
                className="rounded-sm border border-[var(--admin-cell-border)] bg-[var(--admin-zebra-odd)] p-3"
              >
                {editingItem === item.id ? (
                  <ItemForm
                    fields={fields}
                    sectionSlug={sectionSlug}
                    sectionId={section.id}
                    initial={item}
                    listingOptions={listingOptions}
                    supplierOptions={supplierOptions}
                    categoryOptions={categoryOptions}
                    onClose={() => setEditingItem(null)}
                    mode="update"
                  />
                ) : (
                  <ItemSummary
                    item={item}
                    sectionSlug={sectionSlug}
                    onEdit={() => setEditingItem(item.id)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add new item */}
        {showCreate ? (
          <div className="rounded-sm border border-dashed border-[var(--admin-brand)] bg-[var(--admin-card-bg)] p-3">
            <ItemForm
              fields={fields}
              sectionSlug={sectionSlug}
              sectionId={section.id}
              listingOptions={listingOptions}
              supplierOptions={supplierOptions}
              categoryOptions={categoryOptions}
              onClose={() => setShowCreate(false)}
              mode="create"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className={`${adminUi.btnPrimary} px-4 py-2 text-sm`}
          >
            + {t("addItem")}
          </button>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function SectionToggle({
  section,
  t,
}: {
  section: WebHomeSection;
  t: ReturnType<typeof useTranslations>;
}) {
  const [, formAction, pending] = useActionState(
    toggleWebSectionAction,
    null as WebHomepageActionState | null,
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={section.id} />
      <input
        type="checkbox"
        name="enabled"
        defaultChecked={section.enabled}
        onChange={(e) => {
          (e.currentTarget.form as HTMLFormElement).requestSubmit();
        }}
        className={adminUi.checkbox}
      />
      <span className="text-xs text-[var(--admin-text-secondary)]">
        {pending ? "…" : section.enabled ? t("enabled") : t("disabled")}
      </span>
    </form>
  );
}

function SectionMetaForm({
  section,
  t,
}: {
  section: WebHomeSection;
  t: ReturnType<typeof useTranslations>;
}) {
  const [state, formAction, pending] = useActionState(
    updateWebSectionAction,
    null as WebHomepageActionState | null,
  );
  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={section.id} />
      <input type="hidden" name="enabled" value={section.enabled ? "on" : "off"} />

      <Labeled label={t("titleAr")}>
        <input
          name="title_ar"
          defaultValue={section.title_ar ?? ""}
          className={adminUi.input}
        />
      </Labeled>
      <Labeled label={t("titleEn")}>
        <input
          name="title_en"
          defaultValue={section.title_en ?? ""}
          className={adminUi.input}
        />
      </Labeled>
      <Labeled label={t("subtitleAr")}>
        <input
          name="subtitle_ar"
          defaultValue={section.subtitle_ar ?? ""}
          className={adminUi.input}
        />
      </Labeled>
      <Labeled label={t("subtitleEn")}>
        <input
          name="subtitle_en"
          defaultValue={section.subtitle_en ?? ""}
          className={adminUi.input}
        />
      </Labeled>
      <Labeled label={t("sortOrder")}>
        <input
          name="sort_order"
          type="number"
          defaultValue={section.sort_order}
          className={`${adminUi.input} w-24`}
        />
      </Labeled>

      <div className="sm:col-span-2 flex items-center gap-2">
        <button type="submit" className={`${adminUi.btnPrimary} px-4 py-1.5`} disabled={pending}>
          {pending ? "…" : t("saveSection")}
        </button>
        {state && !state.ok ? (
          <p className="text-xs text-red-600">{state.message}</p>
        ) : state && state.ok ? (
          <p className="text-xs text-emerald-600">{t("saved")}</p>
        ) : null}
      </div>
    </form>
  );
}

function ItemSummary({
  item,
  sectionSlug,
  onEdit,
}: {
  item: WebHomeItem;
  sectionSlug: WebHomeSectionSlug;
  onEdit: () => void;
}) {
  const t = useTranslations("adminWebHomepage");
  const [, delAction, delPending] = useActionState(
    deleteWebItemAction,
    null as WebHomepageActionState | null,
  );
  return (
    <div className="flex items-center gap-3">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt=""
          className="h-12 w-12 rounded object-cover border border-[var(--admin-cell-border)] shrink-0"
        />
      ) : item.bg_color ? (
        <div
          className="h-12 w-12 rounded shrink-0 border border-[var(--admin-cell-border)]"
          style={{ backgroundColor: item.bg_color, color: item.fg_color ?? "white" }}
        >
          <span className="block text-center pt-2 text-lg">{item.icon_emoji ?? ""}</span>
        </div>
      ) : (
        <div className="h-12 w-12 rounded shrink-0 border border-dashed border-[var(--admin-cell-border)] flex items-center justify-center text-lg">
          {item.icon_emoji ?? "•"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--admin-text)] truncate">
          {item.title_ar || item.title_en || "(no title)"}
        </p>
        <p className="text-xs text-[var(--admin-text-secondary)] truncate">
          {item.listing
            ? `📦 ${item.listing.title}`
            : item.supplier
            ? `🏭 ${item.supplier.legal_company_name ?? item.supplier.full_name ?? "Supplier"}`
            : item.category_slug
            ? `🗂 ${item.category_slug}`
            : item.href}
        </p>
        <p className="text-[10px] text-[var(--admin-text-secondary)]">
          {t("sortOrder")}: {item.sort_order} · {item.enabled ? t("enabled") : t("disabled")}
        </p>
      </div>

      <button type="button" onClick={onEdit} className={`${adminUi.btnToolbar} px-3 py-1`}>
        {t("edit")}
      </button>

      <form action={delAction}>
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          className={`${adminUi.btnDanger} px-3 py-1`}
          disabled={delPending}
          onClick={(e) => {
            if (!confirm(t("confirmDelete"))) e.preventDefault();
          }}
        >
          {delPending ? "…" : t("delete")}
        </button>
      </form>

      {/* Hint for unused sectionSlug param (kept for future field-specific summaries) */}
      <span hidden>{sectionSlug}</span>
    </div>
  );
}

function ItemForm({
  fields,
  sectionId,
  sectionSlug,
  initial,
  listingOptions,
  supplierOptions,
  categoryOptions,
  onClose,
  mode,
}: {
  fields: FormShape[];
  sectionId: string;
  sectionSlug: WebHomeSectionSlug;
  initial?: WebHomeItem;
  listingOptions: Array<{ id: string; title: string; price: number }>;
  supplierOptions: Array<{ id: string; name: string }>;
  categoryOptions: Array<{ slug: string; label_ar: string }>;
  onClose: () => void;
  mode: "create" | "update";
}) {
  const t = useTranslations("adminWebHomepage");
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createWebItemAction : updateWebItemAction,
    null as WebHomepageActionState | null,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      {mode === "update" && initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      <input type="hidden" name="section_id" value={sectionId} />
      <input type="hidden" name="section_slug" value={sectionSlug} />

      {/* Title always required */}
      {fields.includes("title") ? (
        <>
          <Labeled label={t("titleAr")}>
            <input
              name="title_ar"
              defaultValue={initial?.title_ar ?? ""}
              className={adminUi.input}
            />
          </Labeled>
          <Labeled label={t("titleEn")}>
            <input
              name="title_en"
              defaultValue={initial?.title_en ?? ""}
              className={adminUi.input}
            />
          </Labeled>
        </>
      ) : null}

      {fields.includes("kicker") ? (
        <>
          <Labeled label={t("kickerAr")}>
            <input
              name="kicker_ar"
              defaultValue={initial?.kicker_ar ?? ""}
              className={adminUi.input}
            />
          </Labeled>
          <Labeled label={t("kickerEn")}>
            <input
              name="kicker_en"
              defaultValue={initial?.kicker_en ?? ""}
              className={adminUi.input}
            />
          </Labeled>
        </>
      ) : null}

      {fields.includes("description") ? (
        <>
          <Labeled label={t("descAr")}>
            <textarea
              name="description_ar"
              defaultValue={initial?.description_ar ?? ""}
              rows={2}
              className={adminUi.input}
            />
          </Labeled>
          <Labeled label={t("descEn")}>
            <textarea
              name="description_en"
              defaultValue={initial?.description_en ?? ""}
              rows={2}
              className={adminUi.input}
            />
          </Labeled>
        </>
      ) : null}

      {fields.includes("cta_label") ? (
        <>
          <Labeled label={t("ctaLabelAr")}>
            <input
              name="cta_label_ar"
              defaultValue={initial?.cta_label_ar ?? ""}
              className={adminUi.input}
            />
          </Labeled>
          <Labeled label={t("ctaLabelEn")}>
            <input
              name="cta_label_en"
              defaultValue={initial?.cta_label_en ?? ""}
              className={adminUi.input}
            />
          </Labeled>
        </>
      ) : null}

      {fields.includes("href") ? (
        <Labeled label={t("href")} className="sm:col-span-2">
          <input
            name="href"
            defaultValue={initial?.href ?? "/"}
            className={adminUi.input}
            placeholder="/gallery, /rfq, https://…"
          />
        </Labeled>
      ) : null}

      {fields.includes("image_url") ? (
        <Labeled label={t("imageUrl")} className="sm:col-span-2">
          <input
            name="image_url"
            defaultValue={initial?.image_url ?? ""}
            className={adminUi.input}
            placeholder="https://…"
          />
        </Labeled>
      ) : null}

      {fields.includes("category_slug") ? (
        <Labeled label={t("category")}>
          <select
            name="category_slug"
            defaultValue={initial?.category_slug ?? ""}
            className={adminUi.input}
          >
            <option value="">— {t("none")} —</option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label_ar} ({c.slug})
              </option>
            ))}
          </select>
        </Labeled>
      ) : null}

      {fields.includes("listing_id") ? (
        <Labeled label={t("listing")} className="sm:col-span-2">
          <select
            name="listing_id"
            defaultValue={initial?.listing_id ?? ""}
            className={adminUi.input}
          >
            <option value="">— {t("none")} —</option>
            {listingOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} — {l.price} EGP
              </option>
            ))}
          </select>
        </Labeled>
      ) : null}

      {fields.includes("supplier_id") ? (
        <Labeled label={t("supplier")} className="sm:col-span-2">
          <select
            name="supplier_id"
            defaultValue={initial?.supplier_id ?? ""}
            className={adminUi.input}
          >
            <option value="">— {t("none")} —</option>
            {supplierOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Labeled>
      ) : null}

      {fields.includes("icon_emoji") ? (
        <Labeled label={t("iconEmoji")}>
          <input
            name="icon_emoji"
            defaultValue={initial?.icon_emoji ?? ""}
            className={adminUi.input}
            placeholder="🏗 ⚡ 🦺 🧱"
          />
        </Labeled>
      ) : null}

      {fields.includes("bg_color") ? (
        <Labeled label={t("bgColor")}>
          <input
            name="bg_color"
            type="text"
            defaultValue={initial?.bg_color ?? ""}
            className={adminUi.input}
            placeholder="#B71C1C"
          />
        </Labeled>
      ) : null}
      {fields.includes("fg_color") ? (
        <Labeled label={t("fgColor")}>
          <input
            name="fg_color"
            type="text"
            defaultValue={initial?.fg_color ?? ""}
            className={adminUi.input}
            placeholder="#FFCA28"
          />
        </Labeled>
      ) : null}

      {fields.includes("badge_label") ? (
        <>
          <Labeled label={t("badgeLabelAr")}>
            <input
              name="badge_label_ar"
              defaultValue={initial?.badge_label_ar ?? ""}
              className={adminUi.input}
              placeholder="-25%"
            />
          </Labeled>
          <Labeled label={t("badgeLabelEn")}>
            <input
              name="badge_label_en"
              defaultValue={initial?.badge_label_en ?? ""}
              className={adminUi.input}
              placeholder="-25%"
            />
          </Labeled>
        </>
      ) : null}
      {fields.includes("badge_count") ? (
        <Labeled label={t("badgeCount")}>
          <input
            name="badge_count"
            type="number"
            min={0}
            defaultValue={initial?.badge_count ?? ""}
            className={`${adminUi.input} w-32`}
            placeholder="claimed %"
          />
        </Labeled>
      ) : null}

      <Labeled label={t("sortOrder")}>
        <input
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order ?? 0}
          className={`${adminUi.input} w-24`}
        />
      </Labeled>

      <Labeled label={t("enabled")}>
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={initial?.enabled ?? true}
          className={adminUi.checkbox}
        />
      </Labeled>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <button type="submit" className={`${adminUi.btnPrimary} px-4 py-1.5`} disabled={pending}>
          {pending ? "…" : mode === "create" ? t("create") : t("save")}
        </button>
        <button type="button" onClick={onClose} className={`${adminUi.btnSecondary} px-4 py-1.5`}>
          {t("cancel")}
        </button>
        {state && !state.ok ? (
          <p className="text-xs text-red-600">{state.message}</p>
        ) : state && state.ok ? (
          <p className="text-xs text-emerald-600">{t("saved")}</p>
        ) : null}
      </div>
    </form>
  );
}

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
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-semibold text-[var(--admin-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function labelForSection(
  slug: WebHomeSectionSlug,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (slug) {
    case "web_hero_slider":
      return t("sectionHero");
    case "web_categories_strip":
      return t("sectionCategories");
    case "web_flash_deals":
      return t("sectionFlashDeals");
    case "web_trending":
      return t("sectionTrending");
    case "web_promo_banners":
      return t("sectionPromos");
    case "web_featured_suppliers":
      return t("sectionSuppliers");
  }
}
