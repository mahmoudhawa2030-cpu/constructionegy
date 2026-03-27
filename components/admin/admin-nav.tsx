"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navLinkClass(active: boolean): string {
  const base =
    "rounded-sm px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand)]";
  if (active) {
    return `${base} bg-[var(--admin-row-hover)] text-[var(--admin-brand)]`;
  }
  return `${base} text-[var(--admin-text-secondary)] hover:bg-[var(--admin-row-hover)] hover:text-[var(--admin-text)]`;
}

const HREFS = [
  "/admin",
  "/admin/listings",
  "/admin/users",
  "/admin/messages",
  "/admin/categories",
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const t = useTranslations("admin");

  return (
    <nav aria-label={t("navAria")} className="flex flex-wrap gap-1">
      {HREFS.map((href) => (
        <Link key={href} className={navLinkClass(isActive(pathname, href))} href={href}>
          {href === "/admin"
            ? t("overview")
            : href === "/admin/listings"
              ? t("listings")
              : href === "/admin/users"
                ? t("users")
                : href === "/admin/messages"
                  ? t("chats")
                  : t("categories")}
        </Link>
      ))}
    </nav>
  );
}
