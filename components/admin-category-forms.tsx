"use client";

import { useActionState } from "react";

import {
  createCategoryFromForm,
  deleteCategoryFromForm,
  type CategoryActionState,
  updateCategoryFromForm,
} from "@/app/admin/categories/actions";
import type { CategoryRow } from "@/lib/categories/admin-queries";

export function CreateCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryFromForm, null as CategoryActionState | null);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">إضافة تصنيف</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">المعرف (لاتيني)</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            dir="ltr"
            name="slug"
            pattern="[a-z][a-z0-9_]*"
            placeholder="مثال: scaffolding"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">الاسم بالعربية</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            name="label_ar"
            required
            type="text"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-700 dark:text-zinc-300">ترتيب العرض</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
            defaultValue={0}
            name="sort_order"
            type="number"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input className="rounded border-zinc-300" defaultChecked name="is_active" type="checkbox" />
          <span className="text-zinc-700 dark:text-zinc-300">مفعّل</span>
        </label>
      </div>
      {state?.ok === false ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      ) : null}
      {state?.ok === true && state.message ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>
      ) : null}
      <button
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        disabled={pending}
        type="submit"
      >
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
          className="min-w-[7rem] shrink-0 rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          dir="ltr"
          defaultValue={row.slug}
          name="slug"
          pattern="[a-z][a-z0-9_]*"
          required
          type="text"
        />
        <input
          className="w-[min(100%,16rem)] max-w-[16rem] shrink-0 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          defaultValue={row.label_ar}
          name="label_ar"
          required
          type="text"
        />
        <input
          className="w-14 shrink-0 rounded border border-zinc-300 bg-white px-2 py-1.5 tabular-nums text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          defaultValue={row.sort_order}
          name="sort_order"
          type="number"
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-zinc-700 dark:text-zinc-300">
          <input
            className="rounded border-zinc-300"
            defaultChecked={row.is_active}
            name="is_active"
            type="checkbox"
          />
          مفعّل
        </label>
        <button
          className="shrink-0 rounded bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          disabled={pending}
          type="submit"
        >
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
      <button
        className="shrink-0 rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-900 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        disabled={pending}
        type="submit"
      >
        {pending ? "…" : "حذف"}
      </button>
    </form>
  );
}
