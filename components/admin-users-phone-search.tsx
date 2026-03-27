"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { adminUi } from "@/lib/admin-ui";

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
      <label className={adminUi.label} htmlFor="admin-users-phone">
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
          className={`${adminUi.input} min-w-[10rem] flex-1`}
          defaultValue={searchParams.get("phone") ?? ""}
          dir="ltr"
        />
        <button type="submit" className={adminUi.btnToolbar}>
          بحث
        </button>
      </div>
    </form>
  );
}
