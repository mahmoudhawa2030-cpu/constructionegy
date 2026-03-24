"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function AdminUsersPhoneSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyPhone = useCallback(
    (raw: string) => {
      const phone = raw.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (phone) {
        params.set("phone", phone);
      } else {
        params.delete("phone");
      }
      const q = params.toString();
      router.push(q ? `/admin/users?${q}` : "/admin/users");
    },
    [router, searchParams],
  );

  return (
    <form
      key={searchParams.toString()}
      className="flex min-w-[12rem] flex-col gap-1 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        applyPhone(String(fd.get("phone") ?? ""));
      }}
    >
      <label className="font-medium text-zinc-700 dark:text-zinc-300" htmlFor="admin-users-phone">
        بحث برقم الهاتف
      </label>
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          id="admin-users-phone"
          name="phone"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="مثال: 010 أو جزء من الرقم"
          className="min-w-[10rem] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          defaultValue={searchParams.get("phone") ?? ""}
          dir="ltr"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          بحث
        </button>
      </div>
    </form>
  );
}
