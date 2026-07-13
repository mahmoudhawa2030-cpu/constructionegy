"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type NavItem = { href: string; labelKey: string; icon: string };
type NavGroup = { groupKey: string | null; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    groupKey: null,
    items: [
      {
        href: "/admin",
        labelKey: "overview",
        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
      },
    ],
  },
  {
    groupKey: "sidebarGroupManage",
    items: [
      {
        href: "/admin/listings",
        labelKey: "listings",
        icon: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
      },
      {
        href: "/admin/categories",
        labelKey: "categories",
        icon: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z",
      },
      {
        href: "/admin/homepage",
        labelKey: "homepage",
        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      },
      {
        href: "/admin/media",
        labelKey: "media",
        icon: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6",
      },
      {
        href: "/admin/veterans-corner",
        labelKey: "veteransCorner",
        icon: "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z",
      },
    ],
  },
  {
    groupKey: "sidebarGroupUsers",
    items: [
      {
        href: "/admin/users",
        labelKey: "users",
        icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
      },
      {
        href: "/admin/messages",
        labelKey: "chats",
        icon: "M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0z",
      },
      {
        href: "/admin/verifications",
        labelKey: "businessVerifications",
        icon: "M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
      },
      {
        href: "/admin/expert-verifications",
        labelKey: "expertVerifications",
        icon: "M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z",
      },
      {
        href: "/admin/rfq",
        labelKey: "rfqModeration",
        icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
      },
      {
        href: "/admin/subscriptions",
        labelKey: "subscriptions",
        icon: "M3 7h18v12H3zM3 11h18",
      },
      {
        href: "/admin/deletion-requests",
        labelKey: "deletionRequests",
        icon: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
      },
    ],
  },
  {
    groupKey: "sidebarGroupTools",
    items: [
      {
        href: "/admin/blog/new",
        labelKey: "blog",
        icon: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
      },
      {
        href: "/admin/blog",
        labelKey: "blogPosts",
        icon: "M4 6h16M4 12h16M4 18h10",
      },
      {
        href: "/admin/tracking",
        labelKey: "tracking",
        icon: "M22 12h-4l-3 9L9 3l-3 9H2",
      },
      {
        href: "/admin/news-ticker",
        labelKey: "newsTicker",
        icon: "M4 6h16M4 12h10M4 18h14",
      },
    ],
  },
];

function SvgIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={16}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={16}
    >
      <path d={d} />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  // Posts list only (exact)
  if (href === "/admin/blog") {
    return pathname === "/admin/blog";
  }
  // Blog editor: new post or edit existing (/admin/blog/:id), not the list
  if (href === "/admin/blog/new") {
    if (pathname === "/admin/blog/new") return true;
    if (pathname === "/admin/blog") return false;
    return /^\/admin\/blog\/[^/]+$/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const t = useTranslations("admin");

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 w-52 border-e border-[var(--admin-shell-border)] bg-[var(--admin-card-bg)] overflow-y-auto"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      <nav aria-label={t("navAria")} className="flex flex-col gap-0.5 p-2 pb-6">
        {GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : ""}>
            {group.groupKey && (
              <div className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-text-secondary)]">
                {t(group.groupKey as Parameters<typeof t>[0])}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors no-underline",
                    active
                      ? "bg-[var(--admin-brand)] text-white shadow-sm"
                      : "text-[var(--admin-text)] hover:bg-[var(--admin-zebra-odd)] hover:text-[var(--admin-table-header-text)]",
                  ].join(" ")}
                >
                  <span className={active ? "text-white/90" : "text-[var(--admin-text-secondary)]"}>
                    <SvgIcon d={item.icon} />
                  </span>
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
