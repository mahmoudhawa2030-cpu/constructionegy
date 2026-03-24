"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { PresenceFilter } from "@/lib/admin/presence-filters";

const OPTIONS: { value: PresenceFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "online", label: "متصل الآن (آخر ظهور ~٣–٤ د)" },
  { value: "24h", label: "نشط خلال ٢٤ ساعة" },
  { value: "7d", label: "نشط خلال ٧ أيام" },
  { value: "30d", label: "نشط خلال ٣٠ يوماً" },
  { value: "90d", label: "نشط خلال ٩٠ يوماً" },
  { value: "180d", label: "نشط خلال ١٨٠ يوماً" },
];

type Props = {
  value: PresenceFilter;
};

export function AdminUsersPresenceFilter({ value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">تصفية النشاط</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        value={value}
        onChange={(e) => {
          const next = e.target.value as PresenceFilter;
          const params = new URLSearchParams(searchParams.toString());
          if (next === "all") {
            params.delete("presence");
          } else {
            params.set("presence", next);
          }
          const q = params.toString();
          router.push(q ? `/admin/users?${q}` : "/admin/users");
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
