"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(active: boolean): string {
  const base =
    "rounded-sm border px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand)]";
  if (active) {
    return `${base} border-[var(--admin-brand-press)] bg-gradient-to-b from-[var(--admin-brand-soft)] to-[var(--admin-brand)] text-white`;
  }
  return `${base} border-[var(--admin-shell-border)] bg-gradient-to-b from-white to-[#dce8f2] text-[var(--admin-table-header-text)] hover:to-[#cfe0f0] dark:from-zinc-700 dark:to-zinc-800 dark:text-zinc-100 dark:hover:to-zinc-700`;
}

const NAV_ITEMS: {
  href: string;
  labelKey:
    | "overview"
    | "listings"
    | "users"
    | "chats"
    | "categories"
    | "subscriptionServices"
    | "rfqModeration"
    | "businessVerifications"
    | "homepage";
}[] = [
  { href: "/admin", labelKey: "overview" },
  { href: "/admin/listings", labelKey: "listings" },
  { href: "/admin/users", labelKey: "users" },
  { href: "/admin/messages", labelKey: "chats" },
  { href: "/admin/categories", labelKey: "categories" },
  { href: "/admin/subscription-services", labelKey: "subscriptionServices" },
  { href: "/admin/rfq", labelKey: "rfqModeration" },
  { href: "/admin/verifications", labelKey: "businessVerifications" },
  { href: "/admin/homepage", labelKey: "homepage" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const t = useTranslations("admin");

  return (
    <nav aria-label={t("navAria")} className="flex flex-wrap gap-1.5">
      {NAV_ITEMS.map(({ href, labelKey }) => (
        <Link key={href} className={navLinkClass(isActive(pathname, href))} href={href}>
          {t(labelKey)}
        </Link>
      ))}
    </nav>
  );
}
