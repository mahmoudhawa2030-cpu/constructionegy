import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminNav } from "@/components/admin/admin-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/auth/admin";
import { adminUi } from "@/lib/admin-ui";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.is_banned) {
      redirect("/account-suspended");
    }
  }

  await requireAdmin();

  const t = await getTranslations("admin");

  return (
    <div className={adminUi.shell}>
      <div aria-hidden="true" className={adminUi.brandBar} />
      <header className={adminUi.header}>
        <div className={adminUi.headerInner}>
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={adminUi.headerTitle}>{t("panel")}</span>
              <span className="hidden text-xs font-medium text-[var(--admin-text-secondary)] sm:block">
                {t("shellSubtitle")}
              </span>
            </div>
            <AdminNav />
          </div>
          <div className={adminUi.headerTools}>
            <LocaleSwitcher />
            <ThemeToggle compact />
            <SignOutButton compact />
            <Link
              className={`${adminUi.btnSecondary} no-underline`}
              href="/"
            >
              {t("site")}
            </Link>
          </div>
        </div>
      </header>
      <main className={adminUi.main}>{children}</main>
    </div>
  );
}
