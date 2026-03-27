"use client";

import { useActionState } from "react";

import {
  createCategoryFromForm,
  deleteCategoryFromForm,
  type CategoryActionState,
  updateCategoryFromForm,
} from "@/app/admin/categories/actions";
import type { CategoryRow } from "@/lib/categories/admin-queries";
import { adminUi } from "@/lib/admin-ui";

export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryFromForm, null as CategoryActionState | null);

  return (
    <form
      action={formAction}
      className={`${adminUi.card} flex flex-col gap-3 p-4`}
    >
      <h2 className={`${adminUi.sectionTitle} text-sm`}>إضافة تصنيف</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>المعرف (لاتيني)</span>
          <input
            className={adminUi.inputMono}
            dir="ltr"
            name="slug"
            pattern="[a-z][a-z0-9_]*"
            placeholder="مثال: scaffolding"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>الاسم بالعربية</span>
          <input className={adminUi.input} name="label_ar" required type="text" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={adminUi.label}>ترتيب العرض</span>
          <input className={adminUi.input} defaultValue={0} name="sort_order" type="number" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input className={adminUi.checkbox} defaultChecked name="is_active" type="checkbox" />
          <span className={adminUi.label}>مفعّل</span>
        </label>
      </div>
      {state?.ok === false ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button className={`${adminUi.btnPrimary} w-fit px-4 py-2 text-sm`} disabled={pending} type="submit">
        {pending ? "جاري الإضافة…" : "إضافة"}
      </button>
    </form>
  );
}

export function EditCategoryForm({ row }: { row: CategoryRow }) {
  const [state, formAction, pending] = useActionState(updateCategoryFromForm, null as CategoryActionState | null);

  return (
    <div className="min-w-0 w-full max-w-full">
      <form action={formAction} className="flex flex-nowrap items-center gap-2">
        <input name="id" type="hidden" value={row.id} />
        <input
          className={`${adminUi.inputMono} min-w-[7rem] shrink-0 px-2 py-1.5 text-xs`}
          dir="ltr"
          defaultValue={row.slug}
          name="slug"
          pattern="[a-z][a-z0-9_]*"
          required
          type="text"
        />
        <input
          className={`${adminUi.input} w-[min(100%,16rem)] max-w-[16rem] shrink-0 px-2 py-1.5 text-xs`}
          defaultValue={row.label_ar}
          name="label_ar"
          required
          type="text"
        />
        <input
          className={`${adminUi.input} w-14 shrink-0 px-2 py-1.5 text-xs tabular-nums`}
          defaultValue={row.sort_order}
          name="sort_order"
          type="number"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs">
          <input
            className={adminUi.checkbox}
            defaultChecked={row.is_active}
            name="is_active"
            type="checkbox"
          />
          <span className={adminUi.label}>مفعّل</span>
        </label>
        <button className={`${adminUi.btnPrimary} shrink-0`} disabled={pending} type="submit">
          {pending ? "…" : "حفظ"}
        </button>
      </form>
      {state?.ok === false ? (
        <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="mt-1 truncate text-xs text-emerald-700 dark:text-emerald-400" title={state.message}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function DeleteCategoryForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteCategoryFromForm, null as CategoryActionState | null);

  return (
    <form
      action={formAction}
      className="flex shrink-0 flex-nowrap items-center gap-2"
      onSubmit={(e) => {
        if (!confirm("حذف هذا التصنيف نهائياً؟")) {
          e.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      {state?.ok === false ? (
        <span className="max-w-[12rem] truncate text-xs text-red-600 dark:text-red-400" title={state.message}>
          {state.message}
        </span>
      ) : null}
      <button className={`${adminUi.btnDanger} shrink-0`} disabled={pending} type="submit">
        {pending ? "…" : "حذف"}
      </button>
    </form>
  );
}
