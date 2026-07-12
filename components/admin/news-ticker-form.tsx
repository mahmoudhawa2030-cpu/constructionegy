"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createNewsTicker,
  saveTickerItems,
  updateNewsTicker,
  type TickerActionState,
} from "@/app/admin/news-ticker/actions";
import { adminUi } from "@/lib/admin-ui";
import type {
  NewsTickerConfig,
  NewsTickerItem,
  TickerDataSource,
  TickerPageScope,
} from "@/lib/news-ticker/types";

type Props = {
  mode: "create" | "edit";
  initial?: NewsTickerConfig | null;
};

const emptyItem = (): NewsTickerItem => ({
  id: `tmp-${Math.random().toString(36).slice(2)}`,
  textAr: "",
  textEn: "",
  href: "",
  enabled: true,
  sortOrder: 0,
});

export function NewsTickerForm({ mode, initial }: Props) {
  const t = useTranslations("adminNewsTicker");
  const router = useRouter();
  const action = mode === "create" ? createNewsTicker : updateNewsTicker;
  const [state, formAction, pending] = useActionState(action, null as TickerActionState | null);
  const [itemsState, itemsAction, itemsPending] = useActionState(
    saveTickerItems,
    null as TickerActionState | null,
  );

  const [dataSource, setDataSource] = useState<TickerDataSource>(initial?.dataSource ?? "custom");
  const [pageScope, setPageScope] = useState<TickerPageScope>(initial?.pageScope ?? "all");
  const [items, setItems] = useState<NewsTickerItem[]>(
    initial?.items?.length ? initial.items : [emptyItem()],
  );

  const itemsJson = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    if (state?.ok && mode === "create" && state.id) {
      router.replace(`/admin/news-ticker/${state.id}`);
    }
  }, [state, mode, router]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className={`${adminUi.card} flex flex-col gap-5 p-5`}>
        {mode === "edit" && initial ? <input type="hidden" name="id" value={initial.id} /> : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className={adminUi.label}>{t("fieldName")}</span>
            <input
              className={adminUi.input}
              name="name"
              defaultValue={initial?.name ?? t("defaultName")}
              required
            />
          </label>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={initial?.enabled ?? true}
              className="h-4 w-4 accent-[var(--admin-brand)]"
            />
            <span className={adminUi.label}>{t("fieldEnabled")}</span>
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={adminUi.sectionTitle}>{t("sectionPlacement")}</h2>
          <p className={adminUi.sectionLead}>{t("sectionPlacementLead")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldPlatform")}</span>
              <select
                className={adminUi.input}
                name="platform"
                defaultValue={initial?.platform ?? "both"}
              >
                <option value="both">{t("platformBoth")}</option>
                <option value="web">{t("platformWeb")}</option>
                <option value="mobile">{t("platformMobile")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldPageScope")}</span>
              <select
                className={adminUi.input}
                name="page_scope"
                value={pageScope}
                onChange={(e) => setPageScope(e.target.value as typeof pageScope)}
              >
                <option value="all">{t("scopeAll")}</option>
                <option value="home">{t("scopeHome")}</option>
                <option value="listings">{t("scopeListings")}</option>
                <option value="blog">{t("scopeBlog")}</option>
                <option value="rfq">{t("scopeRfq")}</option>
                <option value="custom">{t("scopeCustom")}</option>
              </select>
            </label>
            {pageScope === "custom" ? (
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className={adminUi.label}>{t("fieldPagePath")}</span>
                <input
                  className={adminUi.inputMono}
                  name="page_path"
                  dir="ltr"
                  defaultValue={initial?.pagePath ?? ""}
                  placeholder="/gallery"
                />
                <span className={adminUi.footnote}>{t("hintPagePath")}</span>
              </label>
            ) : (
              <input type="hidden" name="page_path" value={initial?.pagePath ?? ""} />
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={adminUi.sectionTitle}>{t("sectionSource")}</h2>
          <p className={adminUi.sectionLead}>{t("sectionSourceLead")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldDataSource")}</span>
              <select
                className={adminUi.input}
                name="data_source"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as TickerDataSource)}
              >
                <option value="custom">{t("sourceCustom")}</option>
                <option value="seo_posts">{t("sourceSeoPosts")}</option>
                <option value="listings">{t("sourceListings")}</option>
                <option value="rfq">{t("sourceRfq")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldMaxItems")}</span>
              <input
                className={adminUi.input}
                type="number"
                name="max_items"
                min={1}
                max={50}
                defaultValue={initial?.maxItems ?? 10}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldSpeed")}</span>
              <input
                className={adminUi.input}
                type="number"
                name="speed_seconds"
                min={8}
                max={120}
                defaultValue={initial?.speedSeconds ?? 28}
              />
              <span className={adminUi.footnote}>{t("hintSpeed")}</span>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldSortOrder")}</span>
              <input
                className={adminUi.input}
                type="number"
                name="sort_order"
                defaultValue={initial?.sortOrder ?? 0}
              />
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={adminUi.sectionTitle}>{t("sectionStyle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldLabelAr")}</span>
              <input className={adminUi.input} name="label_ar" defaultValue={initial?.labelAr ?? "عاجل"} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldLabelEn")}</span>
              <input className={adminUi.input} name="label_en" defaultValue={initial?.labelEn ?? "News"} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldBg")}</span>
              <input className={adminUi.inputMono} name="bg_color" type="color" defaultValue={initial?.bgColor ?? "#0f172a"} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldText")}</span>
              <input className={adminUi.inputMono} name="text_color" type="color" defaultValue={initial?.textColor ?? "#f8fafc"} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className={adminUi.label}>{t("fieldAccent")}</span>
              <input className={adminUi.inputMono} name="accent_color" type="color" defaultValue={initial?.accentColor ?? "#ef4444"} />
            </label>
          </div>
        </section>

        {state?.ok === false ? (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        ) : null}
        {state?.ok === true ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("saved")}</p>
        ) : null}

        <button className={`${adminUi.btnPrimary} w-fit px-6 py-2 text-sm`} disabled={pending} type="submit">
          {pending ? t("saving") : mode === "create" ? t("create") : t("save")}
        </button>
      </form>

      {mode === "edit" && initial && dataSource === "custom" ? (
        <form action={itemsAction} className={`${adminUi.card} flex flex-col gap-4 p-5`}>
          <input type="hidden" name="ticker_id" value={initial.id} />
          <input type="hidden" name="items_json" value={itemsJson} />
          <h2 className={adminUi.sectionTitle}>{t("sectionItems")}</h2>
          <p className={adminUi.sectionLead}>{t("sectionItemsLead")}</p>

          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-sm border border-[var(--admin-shell-border)] p-3 sm:grid-cols-2"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className={adminUi.label}>{t("itemTextAr")}</span>
                  <input
                    className={adminUi.input}
                    value={item.textAr}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, textAr: e.target.value };
                      setItems(next);
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className={adminUi.label}>{t("itemTextEn")}</span>
                  <input
                    className={adminUi.input}
                    value={item.textEn}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, textEn: e.target.value };
                      setItems(next);
                    }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className={adminUi.label}>{t("itemHref")}</span>
                  <input
                    className={adminUi.inputMono}
                    dir="ltr"
                    value={item.href}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx] = { ...item, href: e.target.value };
                      setItems(next);
                    }}
                    placeholder="/listings/..."
                  />
                </label>
                <div className="flex items-center justify-between sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx] = { ...item, enabled: e.target.checked };
                        setItems(next);
                      }}
                    />
                    {t("itemEnabled")}
                  </label>
                  <button
                    type="button"
                    className={adminUi.btnSecondary}
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  >
                    {t("itemRemove")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`${adminUi.btnSecondary} w-fit`}
            onClick={() => setItems([...items, emptyItem()])}
          >
            {t("itemAdd")}
          </button>

          {itemsState?.ok === false ? (
            <p className="text-sm text-red-600 dark:text-red-400">{itemsState.message}</p>
          ) : null}
          {itemsState?.ok === true ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("itemsSaved")}</p>
          ) : null}

          <button
            className={`${adminUi.btnPrimary} w-fit px-6 py-2 text-sm`}
            disabled={itemsPending}
            type="submit"
          >
            {itemsPending ? t("saving") : t("saveItems")}
          </button>
        </form>
      ) : null}

      {mode === "edit" && dataSource !== "custom" ? (
        <div className={`${adminUi.cardPadded} text-sm text-[var(--admin-text-secondary)]`}>
          {t("autoSourceHint")}
        </div>
      ) : null}
    </div>
  );
}
